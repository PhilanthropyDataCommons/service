import { generateUpdateItemOperation } from '../generators';
import type {
	Id,
	InternallyWritableOrganizationSyncTask,
	OrganizationSyncTask,
} from '../../../types';

const updateOrganizationSyncTask = generateUpdateItemOperation<
	OrganizationSyncTask,
	Partial<InternallyWritableOrganizationSyncTask>,
	[organizationSyncTaskId: Id]
>(
	'organizationSyncTasks.updateById',
	['status', 'details', 'statusUpdatedAt'],
	['organizationSyncTaskId'],
);

export { updateOrganizationSyncTask };
