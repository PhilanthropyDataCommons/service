import { generateCreateItemOperation } from '../generators';
import type {
	InternallyWritableOrganizationSyncTask,
	OrganizationSyncTask,
} from '../../../types';

const createOrganizationSyncTask = generateCreateItemOperation<
	OrganizationSyncTask,
	InternallyWritableOrganizationSyncTask,
	[]
>('organizationSyncTasks.insertOne', ['status'], []);

export { createOrganizationSyncTask };
