import { isBulkUpload } from '../../types';
import { loadBundle } from './loadBundle';
import type { TinyPgParams } from 'tinypg';
import type {
  Bundle,
  BulkUpload,
} from '../../types';

export const loadBulkUploadBundle = async (
  queryParameters: TinyPgParams,
): Promise<Bundle<BulkUpload>> => loadBundle(
  'bulkUploads.selectWithPagination',
  queryParameters,
  'bulk_uploads',
  isBulkUpload,
);
