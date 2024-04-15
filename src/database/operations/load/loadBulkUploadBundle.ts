import { loadBundle } from './loadBundle';
import type { JsonResultSet, Bundle, BulkUpload } from '../../../types';

export const loadBulkUploadBundle = async (queryParameters: {
	offset: number;
	limit: number;
	createdBy?: number;
}): Promise<Bundle<BulkUpload>> => {
	const defaultQueryParameters = {
		createdBy: 0,
	};
	const { offset, limit, createdBy } = queryParameters;

	const bundle = await loadBundle<JsonResultSet<BulkUpload>>(
		'bulkUploads.selectWithPagination',
		{
			...defaultQueryParameters,
			offset,
			limit,
			createdBy,
		},
		'bulk_uploads',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
