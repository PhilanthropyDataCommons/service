import { isProcessBulkUploadJobPayload } from '../types';
import { InternalValidationError } from '../errors';
import type { JobHelpers } from 'graphile-worker';

export const processBulkUpload = async (
  payload: unknown,
  helpers: JobHelpers,
): Promise<void> => {
  if (!isProcessBulkUploadJobPayload(payload)) {
    helpers.logger.debug('Malformed bulk upload job payload', { errors: isProcessBulkUploadJobPayload.errors ?? [] });
    throw new InternalValidationError(
      'The bulk upload job payload is not properly formed',
      isProcessBulkUploadJobPayload.errors ?? [],
    );
  }
  helpers.logger.debug(`Started processBulkUpload Job for Bulk Upload ID ${payload.bulkUploadId}`);
};
