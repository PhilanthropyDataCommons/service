import { loadBundle } from './loadBundle';
import type { TinyPgParams } from 'tinypg';
import type { Bundle, BulkUpload } from '../../../types';

export const loadBulkUploadBundle = async (
	queryParameters: TinyPgParams,
): Promise<Bundle<BulkUpload>> =>
	loadBundle<BulkUpload>(
		'bulkUploads.selectWithPagination',
		queryParameters,
		'bulk_uploads',
	);
