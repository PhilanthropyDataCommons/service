import { generateLoadBundleOperation } from '../generators';
import type { BaseFieldsCopyTask, KeycloakId } from '../../../types';

const loadBaseFieldsCopyTaskBundle = generateLoadBundleOperation<
	BaseFieldsCopyTask,
	[createdBy: KeycloakId | undefined]
>('baseFieldsCopyTasks.selectWithPagination', 'base_fields_copy_tasks', [
	'createdBy',
]);

export { loadBaseFieldsCopyTaskBundle };
