import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	BulkUpload,
	AuthContext,
	KeycloakUserId,
} from '../../../types';

export const loadBulkUploadBundle = async (
	authContext: AuthContext | undefined,
	createdBy: KeycloakUserId | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<BulkUpload>> => {
	const authContextKeycloakUserId = authContext?.user.keycloakUserId;
	const authContextIsAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<BulkUpload>>(
		'bulkUploads.selectWithPagination',
		{
			authContextIsAdministrator,
			authContextKeycloakUserId,
			createdBy,
			limit,
			offset,
		},
		'bulk_uploads',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
