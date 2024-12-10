import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	BulkUploadTask,
	AuthContext,
	KeycloakId,
} from '../../../types';

export const loadBulkUploadTaskBundle = async (
	authContext: AuthContext | undefined,
	createdBy: KeycloakId | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<BulkUploadTask>> => {
	const authContextKeycloakUserId = authContext?.user.keycloakUserId;
	const authContextIsAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<BulkUploadTask>>(
		'bulkUploadTasks.selectWithPagination',
		{
			authContextIsAdministrator,
			authContextKeycloakUserId,
			createdBy,
			limit,
			offset,
		},
		'bulk_upload_tasks',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
