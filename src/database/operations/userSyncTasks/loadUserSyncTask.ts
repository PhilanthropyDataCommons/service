import { generateLoadItemOperation } from '../generators';
import type { Id, UserSyncTask } from '../../../types';

/**
 * Loads a user sync task. The generated operation passes the auth context
 * binds through to the query, which restricts visibility to the requesting
 * user's own tasks unless the caller is an administrator or has no auth
 * context (as is the case for the graphile worker).
 */
const loadUserSyncTask = generateLoadItemOperation<
	UserSyncTask,
	[userSyncTaskId: Id]
>('userSyncTasks.selectById', 'UserSyncTask', ['userSyncTaskId']);

export { loadUserSyncTask };
