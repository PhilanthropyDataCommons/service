import type { Id } from './Id';
import type { KeycloakId } from './KeycloakId';
import type { OrganizationSyncSummary } from './OrganizationSyncSummary';
import type { TaskStatus } from './TaskStatus';

interface OrganizationSyncTask {
	readonly id: Id;
	readonly status: TaskStatus;
	readonly statusUpdatedAt: string;
	readonly details: OrganizationSyncSummary | { error: string } | null;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type InternallyWritableOrganizationSyncTask = Pick<
	OrganizationSyncTask,
	'status'
> & {
	details?: OrganizationSyncSummary | { error: string } | null;
	statusUpdatedAt?: string;
};

export {
	type InternallyWritableOrganizationSyncTask,
	type OrganizationSyncTask,
};
