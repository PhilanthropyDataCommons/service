import nock from 'nock';
import {
	createOrganizationSyncTask,
	getDatabase,
	loadOrganizationSyncTask,
} from '../../database';
import { KEYCLOAK_RESOURCE_LIST_PAGE_SIZE } from '../../keycloak/fetchPaginatedKeycloakResource';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { createTestUser } from '../../test/factories';
import { expectString } from '../../test/asymettricMatchers';
import { getTestAuthContext } from '../../test/utils';
import { issuer } from '../../auth/jwtOptions';
import { syncOrganizationsFromKeycloak } from '../syncOrganizationsFromKeycloak';
import { stringToKeycloakId, TaskStatus } from '../../types';
import type {
	KeycloakOrganizationMemberRepresentation,
	KeycloakOrganizationRepresentation,
} from '../../keycloak';
import type { TinyPg } from 'tinypg';

const keycloakAdminBaseUrl = issuer.replace('/realms/', '/admin/realms/');
const AUTHORIZATION_HEADER = 'Bearer some.test.jwt';

const FIRST_ORGANIZATION_KEYCLOAK_ID = '11111111-2222-4111-8111-111111111111';
const SECOND_ORGANIZATION_KEYCLOAK_ID = '22222222-3333-4222-8222-222222222222';
const FIRST_MEMBER_KEYCLOAK_ID = '44444444-5555-4333-8333-444444444444';
const SECOND_MEMBER_KEYCLOAK_ID = '55555555-6666-4333-8333-555555555555';
const THIRD_ORGANIZATION_KEYCLOAK_ID = '33333333-4444-4333-8333-333333333333';
const THIRD_MEMBER_KEYCLOAK_ID = '66666666-7777-4333-8333-666666666666';

const funderdome: KeycloakOrganizationRepresentation = {
	id: stringToKeycloakId(FIRST_ORGANIZATION_KEYCLOAK_ID),
	name: 'Funderdome',
	enabled: true,
};

const greta: KeycloakOrganizationMemberRepresentation = {
	id: stringToKeycloakId(FIRST_MEMBER_KEYCLOAK_ID),
	firstName: 'Greta',
	lastName: null,
	enabled: true,
};

const archived: KeycloakOrganizationRepresentation = {
	id: stringToKeycloakId(THIRD_ORGANIZATION_KEYCLOAK_ID),
	name: 'Archived',
	enabled: false,
};

const ida: KeycloakOrganizationMemberRepresentation = {
	id: stringToKeycloakId(THIRD_MEMBER_KEYCLOAK_ID),
	firstName: 'Ida',
	lastName: null,
	enabled: true,
};

const getCreatePendingOrganizationSyncTask = async (db: TinyPg) =>
	await createOrganizationSyncTask(db, await getTestAuthContext(db), {
		status: TaskStatus.PENDING,
	});

const mockKeycloakOrganizations = (
	organizations: KeycloakOrganizationRepresentation[],
) =>
	nock(keycloakAdminBaseUrl)
		.get('/organizations')
		.query({
			briefRepresentation: 'true',
			first: '0',
			max: String(KEYCLOAK_RESOURCE_LIST_PAGE_SIZE),
		})
		.matchHeader('authorization', AUTHORIZATION_HEADER)
		.reply(200, organizations);

const mockKeycloakOrganizationMembers = (
	organizationKeycloakId: string,
	members: KeycloakOrganizationMemberRepresentation[],
) =>
	nock(keycloakAdminBaseUrl)
		.get(`/organizations/${organizationKeycloakId}/members`)
		.query({
			briefRepresentation: 'true',
			first: '0',
			max: String(KEYCLOAK_RESOURCE_LIST_PAGE_SIZE),
		})
		.matchHeader('authorization', AUTHORIZATION_HEADER)
		.reply(200, members);

const getRunOrganizationSyncTask = async (
	db: TinyPg,
	organizationSyncTaskId: number,
) => {
	await syncOrganizationsFromKeycloak(
		{
			organizationSyncTaskId,
			keycloakAdminAuthorizationHeader: AUTHORIZATION_HEADER,
		},
		getMockJobHelpers(),
	);
};
describe('syncOrganizationsFromKeycloak', () => {
	it('merges the Keycloak organizations and members and marks absent organizations disabled', async () => {
		const db = getDatabase();
		await db.query(
			'INSERT INTO organizations (keycloak_organization_id, keycloak_organization_name, synced_from_keycloak_at) VALUES (:keycloakOrganizationId, :keycloakOrganizationName, :syncedFromKeycloakAt);',
			{
				keycloakOrganizationId: SECOND_ORGANIZATION_KEYCLOAK_ID,
				keycloakOrganizationName: 'Gone Gone',
				syncedFromKeycloakAt: '2000-01-01T00:00:00Z',
			},
		);
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(SECOND_MEMBER_KEYCLOAK_ID),
			keycloakUserName: 'Absent',
		});
		await db.query(
			'INSERT INTO user_organization_memberships (user_keycloak_user_id, organization_keycloak_id, synced_from_keycloak_at) VALUES (:userKeycloakUserId, :organizationKeycloakId, :syncedFromKeycloakAt);',
			{
				userKeycloakUserId: SECOND_MEMBER_KEYCLOAK_ID,
				organizationKeycloakId: SECOND_ORGANIZATION_KEYCLOAK_ID,
				syncedFromKeycloakAt: '2000-01-01T00:00:00Z',
			},
		);
		const organizationSyncTask = await getCreatePendingOrganizationSyncTask(db);

		mockKeycloakOrganizations([funderdome, archived]);
		mockKeycloakOrganizationMembers(FIRST_ORGANIZATION_KEYCLOAK_ID, [greta]);
		mockKeycloakOrganizationMembers(THIRD_ORGANIZATION_KEYCLOAK_ID, [ida]);

		await getRunOrganizationSyncTask(db, organizationSyncTask.id);

		const completedTask = await loadOrganizationSyncTask(
			db,
			null,
			organizationSyncTask.id,
		);
		expect(completedTask.status).toBe(TaskStatus.COMPLETED);
		expect(completedTask.details).toEqual({
			organizations: { seen: 2, added: 2, updated: 0, disabled: 2 },
			memberships: { seen: 2, added: 2, updated: 0, disabled: 1 },
		});

		const { rows: organizationRows } = await db.query<{
			keycloak_organization_id: string;
			keycloak_organization_name: string;
			synced_from_keycloak_at: string | null;
			disabled_at: string | null;
		}>(
			'SELECT keycloak_organization_id, keycloak_organization_name, synced_from_keycloak_at::text, disabled_at::text FROM organizations ORDER BY keycloak_organization_name;',
		);
		expect(organizationRows).toEqual([
			{
				keycloak_organization_id: THIRD_ORGANIZATION_KEYCLOAK_ID,
				keycloak_organization_name: 'Archived',
				synced_from_keycloak_at: expectString(),
				disabled_at: expectString(),
			},
			{
				keycloak_organization_id: FIRST_ORGANIZATION_KEYCLOAK_ID,
				keycloak_organization_name: 'Funderdome',
				synced_from_keycloak_at: expectString(),
				disabled_at: null,
			},
			{
				keycloak_organization_id: SECOND_ORGANIZATION_KEYCLOAK_ID,
				keycloak_organization_name: 'Gone Gone',
				synced_from_keycloak_at: expectString(),
				disabled_at: expectString(),
			},
		]);

		const { rows: membershipRows } = await db.query<{
			user_keycloak_user_id: string;
			organization_keycloak_id: string;
			disabled_at: string | null;
		}>(
			'SELECT user_keycloak_user_id, organization_keycloak_id, disabled_at::text FROM user_organization_memberships ORDER BY user_keycloak_user_id;',
		);
		expect(membershipRows).toEqual([
			{
				user_keycloak_user_id: FIRST_MEMBER_KEYCLOAK_ID,
				organization_keycloak_id: FIRST_ORGANIZATION_KEYCLOAK_ID,
				disabled_at: null,
			},
			{
				user_keycloak_user_id: SECOND_MEMBER_KEYCLOAK_ID,
				organization_keycloak_id: SECOND_ORGANIZATION_KEYCLOAK_ID,
				disabled_at: expectString(),
			},
			{
				user_keycloak_user_id: THIRD_MEMBER_KEYCLOAK_ID,
				organization_keycloak_id: THIRD_ORGANIZATION_KEYCLOAK_ID,
				disabled_at: null,
			},
		]);

		const { rows: memberUserRows } = await db.query<{
			keycloak_user_id: string;
			keycloak_user_name: string;
			disabled_at: string | null;
		}>(
			'SELECT keycloak_user_id, keycloak_user_name, disabled_at::text FROM users WHERE keycloak_user_id = :keycloakUserId;',
			{ keycloakUserId: FIRST_MEMBER_KEYCLOAK_ID },
		);
		expect(memberUserRows).toEqual([
			{
				keycloak_user_id: FIRST_MEMBER_KEYCLOAK_ID,
				keycloak_user_name: 'Greta',
				disabled_at: null,
			},
		]);
	});
	it('updates organization names and clears disabledAt when Keycloak reports them live again', async () => {
		const db = getDatabase();
		await db.query(
			'INSERT INTO organizations (keycloak_organization_id, keycloak_organization_name, synced_from_keycloak_at, disabled_at) VALUES (:keycloakOrganizationId, :keycloakOrganizationName, :syncedFromKeycloakAt, :disabledAt);',
			{
				keycloakOrganizationId: FIRST_ORGANIZATION_KEYCLOAK_ID,
				keycloakOrganizationName: 'Stale Name',
				syncedFromKeycloakAt: '2000-01-01T00:00:00Z',
				disabledAt: '2000-01-01T00:00:00Z',
			},
		);
		const organizationSyncTask = await getCreatePendingOrganizationSyncTask(db);

		mockKeycloakOrganizations([funderdome]);
		mockKeycloakOrganizationMembers(FIRST_ORGANIZATION_KEYCLOAK_ID, []);

		await getRunOrganizationSyncTask(db, organizationSyncTask.id);

		const completedTask = await loadOrganizationSyncTask(
			db,
			null,
			organizationSyncTask.id,
		);
		expect(completedTask.status).toBe(TaskStatus.COMPLETED);
		expect(completedTask.details).toEqual({
			organizations: { seen: 1, added: 0, updated: 1, disabled: 0 },
			memberships: { seen: 0, added: 0, updated: 0, disabled: 0 },
		});

		const { rows: organizationRows } = await db.query<{
			keycloak_organization_name: string;
			disabled_at: string | null;
		}>(
			'SELECT keycloak_organization_name, disabled_at::text FROM organizations WHERE keycloak_organization_id = :keycloakOrganizationId;',
			{ keycloakOrganizationId: FIRST_ORGANIZATION_KEYCLOAK_ID },
		);
		expect(organizationRows).toEqual([
			{ keycloak_organization_name: 'Funderdome', disabled_at: null },
		]);
	});

	it('skips the sweeps when the organization listing is empty', async () => {
		const db = getDatabase();
		await db.query(
			'INSERT INTO organizations (keycloak_organization_id, keycloak_organization_name, synced_from_keycloak_at) VALUES (:keycloakOrganizationId, :keycloakOrganizationName, :syncedFromKeycloakAt);',
			{
				keycloakOrganizationId: FIRST_ORGANIZATION_KEYCLOAK_ID,
				keycloakOrganizationName: 'Funderdome',
				syncedFromKeycloakAt: '2000-01-01T00:00:00Z',
			},
		);
		const organizationSyncTask = await getCreatePendingOrganizationSyncTask(db);

		mockKeycloakOrganizations([]);

		await getRunOrganizationSyncTask(db, organizationSyncTask.id);

		const completedTask = await loadOrganizationSyncTask(
			db,
			null,
			organizationSyncTask.id,
		);
		expect(completedTask.status).toBe(TaskStatus.COMPLETED);
		expect(completedTask.details).toEqual({
			organizations: { seen: 0, added: 0, updated: 0, disabled: 0 },
			memberships: { seen: 0, added: 0, updated: 0, disabled: 0 },
		});

		const { rows: organizationRows } = await db.query<{
			disabled_at: string | null;
		}>(
			'SELECT disabled_at::text FROM organizations WHERE keycloak_organization_id = :keycloakOrganizationId;',
			{ keycloakOrganizationId: FIRST_ORGANIZATION_KEYCLOAK_ID },
		);
		expect(organizationRows).toEqual([{ disabled_at: null }]);
	});

	it('marks the task FAILED when the Keycloak organization listing fails', async () => {
		const db = getDatabase();
		const organizationSyncTask = await getCreatePendingOrganizationSyncTask(db);

		nock(keycloakAdminBaseUrl)
			.get('/organizations')
			.query(true)
			.matchHeader('authorization', AUTHORIZATION_HEADER)
			.reply(500, { error: 'HTTP 500 Internal Server Error' });

		await getRunOrganizationSyncTask(db, organizationSyncTask.id);

		const failedTask = await loadOrganizationSyncTask(
			db,
			null,
			organizationSyncTask.id,
		);
		expect(failedTask.status).toBe(TaskStatus.FAILED);
		if (failedTask.details === null || !('error' in failedTask.details)) {
			throw new Error('The failed task lacks an error in its details.');
		}
		expect(failedTask.details.error).toContain('500');
	});
});
