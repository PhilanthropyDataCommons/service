import { generateLoadBundleOperation } from '../generators';
import type { BaseFieldsCopyTask, KeycloakId } from '../../../types';

const loadBaseFieldsCopyTaskBundle = generateLoadBundleOperation<
	BaseFieldsCopyTask,
	[
		authContextKeycloakUserId: KeycloakId | undefined,
		authContextIsAdministrator: boolean | undefined,
		createdBy: KeycloakId | undefined,
	]
>('baseFieldsCopyTasks.selectWithPagination', 'base_fields_copy_tasks', [
	'authContextKeycloakUserId',
	'authContextIsAdministrator',
	'createdBy',
]);

export { loadBaseFieldsCopyTaskBundle };
