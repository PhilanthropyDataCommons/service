import { generateLoadItemOperation } from '../generators';
import type { Id, UserSyncTask } from '../../../types';

const loadUserSyncTask = generateLoadItemOperation<
	UserSyncTask,
	[userSyncTaskId: Id]
>('userSyncTasks.selectById', 'UserSyncTask', ['userSyncTaskId']);

export { loadUserSyncTask };
