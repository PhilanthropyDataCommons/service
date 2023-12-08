import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { requireEnv } from 'require-env-variable';
import tmp from 'tmp-promise';
import { s3Client } from '../s3Client';
import { db } from '../database/db';
import { loadBulkUpload } from '../database/accessors';
import {
  BulkUploadStatus,
  isProcessBulkUploadJobPayload,
} from '../types';
import { NotFoundError } from '../errors';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import type { JobHelpers } from 'graphile-worker';
import type { FileResult } from 'tmp-promise';
import type { BulkUpload } from '../types';

const {
  S3_BUCKET,
} = requireEnv(
  'S3_BUCKET',
);

const updateBulkUploadStatus = async (
  id: number,
  status: BulkUploadStatus,
): Promise<void> => {
  const bulkUploadsQueryResult = await db.sql<BulkUpload>('bulkUploads.updateStatusById', {
    id,
    status,
  });
  if (bulkUploadsQueryResult.row_count !== 1) {
    throw new NotFoundError(`The bulk upload was not found (id: ${id})`);
  }
};

const downloadS3ObjectToTemporaryStorage = async (key: string): Promise<FileResult> => {
  let temporaryFile: FileResult;
  try {
    temporaryFile = await tmp.file();
  } catch (err) {
    throw new Error('Unable to create a temporary file');
  }
  const writeStream = fs.createWriteStream(
    temporaryFile.path,
    { autoClose: true },
  );

  let s3Response: GetObjectCommandOutput;
  try {
    s3Response = await s3Client.getObject({
      Key: key,
      Bucket: S3_BUCKET,
    });
    if (s3Response.Body === undefined) {
      throw new Error('S3 did not return a body');
    }
  } catch (err) {
    await temporaryFile.cleanup();
    throw err;
  }

  const s3Body = (s3Response.Body as Readable);
  try {
    await finished(s3Body.pipe(writeStream));
  } catch (err) {
    await temporaryFile.cleanup();
    throw err;
  }

  return temporaryFile;
};

export const processBulkUpload = async (
  payload: unknown,
  helpers: JobHelpers,
): Promise<void> => {
  if (!isProcessBulkUploadJobPayload(payload)) {
    helpers.logger.error('Malformed bulk upload job payload', { errors: isProcessBulkUploadJobPayload.errors ?? [] });
    return;
  }
  helpers.logger.debug(`Started processBulkUpload Job for Bulk Upload ID ${payload.bulkUploadId}`);
  const bulkUpload = await loadBulkUpload(payload.bulkUploadId);
  let bulkUploadFile: FileResult;
  try {
    await updateBulkUploadStatus(bulkUpload.id, BulkUploadStatus.IN_PROGRESS);
    bulkUploadFile = await downloadS3ObjectToTemporaryStorage(bulkUpload.sourceKey);
  } catch (error) {
    helpers.logger.info('Bulk upload is being marked as failed', { error });
    await updateBulkUploadStatus(bulkUpload.id, BulkUploadStatus.FAILED);
    return;
  }
  try {
    await bulkUploadFile.cleanup();
  } catch (error) {
    helpers.logger.warn(
      `Cleanup of a temporary file failed (${bulkUploadFile.path})`,
      { error },
    );
  }
  await updateBulkUploadStatus(bulkUpload.id, BulkUploadStatus.COMPLETED);
};
