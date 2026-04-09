import { generateLoadBundleOperation } from '../generators';
import type { BaseFieldsCopyTask, KeycloakId } from '../../../types';

const loadBaseFieldsCopyTaskBundle = generateLoadBundleOperation<
	BaseFieldsCopyTask,
	[createdBy: KeycloakId | undefined]
>('baseFieldsCopyTasks.selectWithPagination', ['createdBy']);

export { loadBaseFieldsCopyTaskBundle };
