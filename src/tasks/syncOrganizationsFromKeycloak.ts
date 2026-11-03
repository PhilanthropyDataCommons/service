import { getDatabase } from '../database/db';
import {
	loadOrganizationSyncTask,
	updateOrganizationSyncTask,
} from '../database';
import {
	isSyncOrganizationsFromKeycloakJobPayload,
	TaskStatus,
} from '../types';
import type { JobHelpers } from 'graphile-worker';

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
	const { organizationSyncTaskId } = payload;
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
	await updateOrganizationSyncTask(
		db,
		null,
		{
			status: TaskStatus.COMPLETED,
			statusUpdatedAt: new Date().toISOString(),
		},
		organizationSyncTaskId,
	);
};

export { syncOrganizationsFromKeycloak };
