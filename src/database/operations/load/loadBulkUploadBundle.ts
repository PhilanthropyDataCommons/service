import { loadBundle } from './loadBundle';
import type {
	JsonResultSet,
	Bundle,
	BulkUpload,
	AuthContext,
} from '../../../types';

export const loadBulkUploadBundle = async (
	queryParameters: {
		offset: number;
		limit: number;
		createdBy?: number;
	},
	authContext?: AuthContext,
): Promise<Bundle<BulkUpload>> => {
	const defaultQueryParameters = {
		createdBy: 0,
		userId: 0,
		isAdministrator: false,
	};
	const { offset, limit, createdBy } = queryParameters;
	const userId = authContext?.user.id;
	const isAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<BulkUpload>>(
		'bulkUploads.selectWithPagination',
		{
			...defaultQueryParameters,
			offset,
			limit,
			createdBy,
			userId,
			isAdministrator,
		},
		'bulk_uploads',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
