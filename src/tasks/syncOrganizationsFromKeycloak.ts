import { getDatabase } from '../database/db';
import {
	createServiceQueryAuditLog,
	loadOrganizationSyncTask,
	updateOrganizationSyncTask,
} from '../database';
import {
	deleteManyOrganizationsByLastSyncedBefore,
	insertOrUpdateManyOrganizations,
	type ListedOrganization,
} from '../database/operations/organizations';
import {
	deleteManyOrganizationMembershipsByLastSyncedBefore,
	insertOrUpdateManyOrganizationMemberships,
} from '../database/operations/userOrganizationMemberships';
import { insertOrUpdateMany as insertOrUpdateUsers } from '../database/operations/users';
import {
	fetchKeycloakOrganizationMembers,
	fetchKeycloakOrganizations,
} from '../keycloak';
import {
	isSyncOrganizationsFromKeycloakJobPayload,
	nonNullKeycloakIdToString,
	TaskStatus,
} from '../types';
import { toFullName } from './syncUsersFromKeycloak';
import type { JobHelpers } from 'graphile-worker';
import type { TinyPg } from 'tinypg';
import type { OrganizationSyncSummary } from '../types';

const NO_SEEN_COUNT = 0;

interface MembershipSyncOutcome {
	seen: number;
	added: number;
	updated: number;
	disabled: number;
}

const syncOrganizationMembers = async (
	db: TinyPg,
	keycloakAdminAuthorizationHeader: string,
	organization: ListedOrganization,
	organizationReceivedAtIso: string,
): Promise<MembershipSyncOutcome> => {
	let seenMembershipsForOrganization = NO_SEEN_COUNT;
	let addedMemberships = 0;
	let updatedMemberships = 0;
	let lastReceivedAtIso = organizationReceivedAtIso;
	for await (const {
		members: memberPage,
		receivedAt,
	} of fetchKeycloakOrganizationMembers(
		keycloakAdminAuthorizationHeader,
		organization.id,
	)) {
		const memberReceivedAtIso = receivedAt.toISOString();
		lastReceivedAtIso = memberReceivedAtIso;
		const listedUsers = memberPage.map(
			({ id, firstName, lastName, enabled }) => ({
				id,
				name: toFullName(firstName, lastName),
				enabled,
			}),
		);
		await insertOrUpdateUsers(
			db,
			listedUsers,
			memberReceivedAtIso,
			memberReceivedAtIso,
		);
		const listedMemberships = memberPage.map(({ id }) => ({
			userKeycloakUserId: id,
			organizationKeycloakId: organization.id,
		}));
		const membershipMergeResult =
			await insertOrUpdateManyOrganizationMemberships(
				db,
				listedMemberships,
				memberReceivedAtIso,
			);
		const { length: addedMembershipsFromPage } = membershipMergeResult.filter(
			(row) => row.wasInserted,
		);
		addedMemberships += addedMembershipsFromPage;
		updatedMemberships +=
			membershipMergeResult.length - addedMembershipsFromPage;
		seenMembershipsForOrganization += memberPage.length;
	}
	const disabledAtIso = new Date().toISOString();
	const deleteResult =
		await deleteManyOrganizationMembershipsByLastSyncedBefore(
			db,
			organizationReceivedAtIso,
			disabledAtIso,
			lastReceivedAtIso,
			nonNullKeycloakIdToString(organization.id),
		);
	return {
		seen: seenMembershipsForOrganization,
		added: addedMemberships,
		updated: updatedMemberships,
		disabled: deleteResult.length,
	};
};

const syncRealmOrganizations = async (
	db: TinyPg,
	keycloakAdminAuthorizationHeader: string,
): Promise<OrganizationSyncSummary> => {
	let seenOrganizationsCount = NO_SEEN_COUNT;
	let seenMembershipsCount = NO_SEEN_COUNT;
	let syncStartedAtIso: string | null = null;
	let lastReceivedAtIso: string | null = null;
	let addedOrganizations = 0;
	let updatedOrganizations = 0;
	let disabledOrganizations = 0;
	let addedMemberships = 0;
	let updatedMemberships = 0;
	let disabledMemberships = 0;
	for await (const {
		organizations: page,
		receivedAt,
	} of fetchKeycloakOrganizations(keycloakAdminAuthorizationHeader)) {
		const receivedAtIso = receivedAt.toISOString();
		lastReceivedAtIso = receivedAtIso;
		syncStartedAtIso ??= receivedAtIso;
		const listedOrganizations = page.map(({ id, name, enabled }) => ({
			id,
			name: name ?? null,
			enabled,
		}));
		const mergeResult = await insertOrUpdateManyOrganizations(
			db,
			listedOrganizations,
			receivedAtIso,
			receivedAtIso,
		);
		const { length: addedFromPage } = mergeResult.filter(
			(row) => row.wasInserted,
		);
		addedOrganizations += addedFromPage;
		updatedOrganizations += mergeResult.length - addedFromPage;
		disabledOrganizations += listedOrganizations.filter(
			(organization) => !organization.enabled,
		).length;
		seenOrganizationsCount += listedOrganizations.length;
		/* eslint-disable no-await-in-loop -- each organization's members are walked before the next organization starts */
		for (const organization of listedOrganizations) {
			const organizationMembersOutcome = await syncOrganizationMembers(
				db,
				keycloakAdminAuthorizationHeader,
				organization,
				receivedAtIso,
			);
			addedMemberships += organizationMembersOutcome.added;
			updatedMemberships += organizationMembersOutcome.updated;
			disabledMemberships += organizationMembersOutcome.disabled;
			seenMembershipsCount += organizationMembersOutcome.seen;
		}
		/* eslint-enable no-await-in-loop */
	}
	if (seenOrganizationsCount !== NO_SEEN_COUNT && syncStartedAtIso !== null) {
		const disabledAtIso = new Date().toISOString();
		const disableResult = await deleteManyOrganizationsByLastSyncedBefore(
			db,
			syncStartedAtIso,
			disabledAtIso,
			lastReceivedAtIso,
		);
		disabledOrganizations += disableResult.length;
		const membershipDisableResult =
			await deleteManyOrganizationMembershipsByLastSyncedBefore(
				db,
				syncStartedAtIso,
				disabledAtIso,
				lastReceivedAtIso,
			);
		disabledMemberships += membershipDisableResult.length;
	}
	const summary: OrganizationSyncSummary = {
		organizations: {
			seen: seenOrganizationsCount,
			added: addedOrganizations,
			updated: updatedOrganizations,
			disabled: disabledOrganizations,
		},
		memberships: {
			seen: seenMembershipsCount,
			added: addedMemberships,
			updated: updatedMemberships,
			disabled: disabledMemberships,
		},
	};
	await createServiceQueryAuditLog(db, null, {
		queryName: 'organizations.syncFromKeycloak',
		queryParameters: summary,
	});
	return summary;
};
const syncOrganizationsFromKeycloak = async (
	payload: unknown,
	helpers: JobHelpers,
): Promise<void> => {
	const { logger: graphileLogger } = helpers;
	const db = getDatabase();
	if (!isSyncOrganizationsFromKeycloakJobPayload(payload)) {
		graphileLogger.error('Malformed organization sync job payload', {
			errors: isSyncOrganizationsFromKeycloakJobPayload.errors ?? [],
		});
		return;
	}
	const { organizationSyncTaskId, keycloakAdminAuthorizationHeader } = payload;
	try {
		const organizationSyncTask = await loadOrganizationSyncTask(
			db,
			null,
			organizationSyncTaskId,
		);
		if (organizationSyncTask.status !== TaskStatus.PENDING) {
			graphileLogger.warn(
				'Organization sync task cannot be processed because it is not in a PENDING state',
				{ organizationSyncTaskId, status: organizationSyncTask.status },
			);
			return;
		}
		await updateOrganizationSyncTask(
			db,
			null,
			{
				status: TaskStatus.IN_PROGRESS,
				statusUpdatedAt: new Date().toISOString(),
			},
			organizationSyncTaskId,
		);
		const summary = await syncRealmOrganizations(
			db,
			keycloakAdminAuthorizationHeader,
		);
		if (summary.organizations.seen === NO_SEEN_COUNT) {
			graphileLogger.warn(
				'The Keycloak organization listing was empty; organizations and memberships were not disabled this run',
				{ organizationSyncTaskId },
			);
		}
		await updateOrganizationSyncTask(
			db,
			null,
			{
				status: TaskStatus.COMPLETED,
				details: summary,
				statusUpdatedAt: new Date().toISOString(),
			},
			organizationSyncTaskId,
		);
	} catch (err) {
		graphileLogger.warn('Syncing organizations from Keycloak failed', {
			err,
		});
		try {
			await updateOrganizationSyncTask(
				db,
				null,
				{
					status: TaskStatus.FAILED,
					details: {
						error: err instanceof Error ? err.message : String(err),
					},
					statusUpdatedAt: new Date().toISOString(),
				},
				organizationSyncTaskId,
			);
		} catch (updateError) {
			graphileLogger.warn(
				'Failed to mark the organization sync task as failed; the job error is retained by graphile-worker',
				{ err: updateError },
			);
		}
	}
};

export { syncOrganizationsFromKeycloak };
