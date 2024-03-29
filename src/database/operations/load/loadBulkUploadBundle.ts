import { loadBundle } from './loadBundle';
import type { TinyPgParams } from 'tinypg';
import type { JsonResultSet, Bundle, BulkUpload } from '../../../types';

export const loadBulkUploadBundle = async (
	queryParameters: TinyPgParams,
): Promise<Bundle<BulkUpload>> => {
	const bundle = await loadBundle<JsonResultSet<BulkUpload>>(
		'bulkUploads.selectWithPagination',
		queryParameters,
		'bulk_uploads',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
