import { generateUpdateItemOperation } from '../generators';
import type {
	Id,
	InternallyWritableUserSyncTask,
	UserSyncTask,
} from '../../../types';

const updateUserSyncTask = generateUpdateItemOperation<
	UserSyncTask,
	Partial<InternallyWritableUserSyncTask>,
	[userSyncTaskId: Id]
>(
	'userSyncTasks.updateById',
	['status', 'details', 'statusUpdatedAt'],
	['userSyncTaskId'],
);

export { updateUserSyncTask };
