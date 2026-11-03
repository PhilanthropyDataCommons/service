import { generateLoadItemOperation } from '../generators';
import type { Id, OrganizationSyncTask } from '../../../types';

const loadOrganizationSyncTask = generateLoadItemOperation<
	OrganizationSyncTask,
	[organizationSyncTaskId: Id]
>('organizationSyncTasks.selectById', 'OrganizationSyncTask', [
	'organizationSyncTaskId',
]);

export { loadOrganizationSyncTask };
