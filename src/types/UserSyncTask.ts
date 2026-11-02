import type { Id } from './Id';
import type { KeycloakId } from './KeycloakId';
import type { TaskStatus } from './TaskStatus';
import type { UserSyncSummary } from './UserSyncSummary';

interface UserSyncTask {
	readonly id: Id;
	readonly status: TaskStatus;
	readonly statusUpdatedAt: string;
	readonly details: UserSyncSummary | null;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

type InternallyWritableUserSyncTask = Pick<UserSyncTask, 'status'> & {
	details?: UserSyncSummary | null;
	statusUpdatedAt?: string;
};

export { type InternallyWritableUserSyncTask, type UserSyncTask };
