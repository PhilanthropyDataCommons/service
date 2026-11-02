import { generateCreateItemOperation } from '../generators';
import type {
	InternallyWritableUserSyncTask,
	UserSyncTask,
} from '../../../types';

const createUserSyncTask = generateCreateItemOperation<
	UserSyncTask,
	InternallyWritableUserSyncTask,
	[]
>('userSyncTasks.insertOne', ['status'], []);

export { createUserSyncTask };
