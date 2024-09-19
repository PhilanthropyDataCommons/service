import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	BulkUpload,
	AuthContext,
} from '../../../types';

export const loadBulkUploadBundle = async (
	authContext: AuthContext | undefined,
	createdBy: number | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<BulkUpload>> => {
	const userId = authContext?.user.id;
	const isAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<BulkUpload>>(
		'bulkUploads.selectWithPagination',
		{
			createdBy,
			isAdministrator,
			limit,
			offset,
			userId,
		},
		'bulk_uploads',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
