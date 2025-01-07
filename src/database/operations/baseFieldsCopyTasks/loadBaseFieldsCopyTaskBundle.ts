import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	BaseFieldsCopyTask,
	AuthContext,
	KeycloakId,
} from '../../../types';

export const loadBaseFieldsCopyTaskBundle = async (
	authContext: AuthContext | undefined,
	createdBy: KeycloakId | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<BaseFieldsCopyTask>> => {
	const authContextKeycloakUserId = authContext?.user.keycloakUserId;
	const authContextIsAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<BaseFieldsCopyTask>>(
		'baseFieldsCopyTasks.selectWithPagination',
		{
			authContextIsAdministrator,
			authContextKeycloakUserId,
			createdBy,
			limit,
			offset,
		},
		'base_fields_copy_tasks',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
