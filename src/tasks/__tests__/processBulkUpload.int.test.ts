import nock from 'nock';
import { requireEnv } from 'require-env-variable';
import {
  db,
  loadBulkUpload,
} from '../../database';
import { s3Client } from '../../s3Client';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processBulkUpload } from '../processBulkUpload';
import { BulkUploadStatus } from '../../types';
import type { BulkUpload } from '../../types';

const {
  S3_BUCKET,
  S3_PATH_STYLE,
} = requireEnv(
  'S3_BUCKET',
  'S3_PATH_STYLE',
);

const getS3Endpoint = async () => {
  if (s3Client.config.endpoint === undefined) {
    throw new Error('The S3 client is not configured with an endpoint');
  }
  const {
    hostname,
    protocol,
  } = await s3Client.config.endpoint();
  return S3_PATH_STYLE === 'true'
    ? `${protocol}//${hostname}`
    : `${protocol}//${S3_BUCKET}.${hostname}`;
};

const getS3Path = () => (
  S3_PATH_STYLE === 'true'
    ? `/${S3_BUCKET}`
    : ''
);

const getS3KeyPath = (key: string) => (
  `${getS3Path()}/${key}`
);

const createTestBulkUpload = async (overrideValues?: Partial<BulkUpload>): Promise<BulkUpload> => {
  const defaultValues = {
    fileName: 'bar.csv',
    sourceKey: '550e8400-e29b-41d4-a716-446655440000',
    status: BulkUploadStatus.PENDING,
  };
  const bulkUploadsQueryResult = await db.sql<BulkUpload>('bulkUploads.insertOne', {
    ...defaultValues,
    ...overrideValues,
  });
  const bulkUpload = bulkUploadsQueryResult.rows[0];
  if (bulkUpload === undefined) {
    throw new Error("Couldn't create a bulk upload");
  }
  return bulkUpload;
};

describe('processBulkUpload', () => {
  it('should attempt to access the contents of the sourceKey associated with the specified bulk upload', async () => {
    const sourceKey = '550e8400-e29b-41d4-a716-446655440000';
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const sourceRequest = nock(await getS3Endpoint())
      .get(getS3KeyPath(sourceKey))
      .query({ 'x-id': 'GetObject' })
      .replyWithFile(
        200,
        `${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
      );

    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    expect(sourceRequest.isDone()).toEqual(true);
  });

  it('should set the status of the upload to FAILED if the sourceKey is not accessible', async () => {
    const sourceKey = '550e8400-e29b-41d4-a716-446655440000';
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const sourceRequest = nock(await getS3Endpoint())
      .get(getS3KeyPath(sourceKey))
      .query({ 'x-id': 'GetObject' })
      .reply(404);

    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
    expect(updatedBulkUpload.status).toEqual(BulkUploadStatus.FAILED);
    expect(sourceRequest.isDone()).toEqual(true);
  });

  it('should set the status of the upload to COMPLETED if the sourceKey is accessible', async () => {
    const sourceKey = '550e8400-e29b-41d4-a716-446655440000';
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const sourceRequest = nock(await getS3Endpoint())
      .get(getS3KeyPath(sourceKey))
      .query({ 'x-id': 'GetObject' })
      .replyWithFile(
        200,
        `${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
      );

    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
    expect(updatedBulkUpload.status).toEqual(BulkUploadStatus.COMPLETED);
    expect(sourceRequest.isDone()).toEqual(true);
  });
});
