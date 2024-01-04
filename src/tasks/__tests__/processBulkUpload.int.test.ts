import nock from 'nock';
import { requireEnv } from 'require-env-variable';
import {
  db,
  loadBulkUpload,
} from '../../database';
import { s3Client } from '../../s3Client';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processBulkUpload } from '../processBulkUpload';
import { BulkUploadStatus, Proposal } from '../../types';
import type {
  BulkUpload,
  ProposalFieldValue,
  ProposalVersion,
} from '../../types';

const {
  S3_BUCKET,
  S3_PATH_STYLE,
} = requireEnv(
  'S3_BUCKET',
  'S3_PATH_STYLE',
);

const TEST_UNPROCESSED_SOURCE_KEY = 'unprocessed/550e8400-e29b-41d4-a716-446655440000';

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
    sourceKey: TEST_UNPROCESSED_SOURCE_KEY,
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

const createTestBaseFields = async (): Promise<void> => {
  await db.sql<BulkUpload>('baseFields.insertOne', {
    label: 'Proposal Submitter Email',
    description: 'The email address of the person who submitted the proposal.',
    shortCode: 'proposal_submitter_email',
    dataType: 'string',
  });
  await db.sql<BulkUpload>('baseFields.insertOne', {
    label: 'Organization Name',
    description: 'The name of the applying organization.',
    shortCode: 'organization_name',
    dataType: 'string',
  });
};

const mockS3GetObjectReplyWithFile = async (
  sourceKey: string,
  filePath: string,
) => nock(await getS3Endpoint())
  .get(getS3KeyPath(sourceKey))
  .query({ 'x-id': 'GetObject' })
  .replyWithFile(
    200,
    filePath,
  );

const mockS3CopyObjectReply = async (sourceKey: string) => nock(await getS3Endpoint())
  .put(getS3KeyPath(`${sourceKey}`))
  .query({ 'x-id': 'CopyObject' })
  .reply(
    200,
    '<?xml version="1.0" encoding="UTF-8"?><CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2024-01-02T19:24:50.814Z</LastModified><ETag>745905cba4f8bfd2394f34e61d035a36</ETag></CopyObjectResult>',
  );

const mockS3DeleteObjectReply = async (sourceKey: string) => nock(await getS3Endpoint())
  .delete(getS3KeyPath(`${sourceKey}`))
  .query({ 'x-id': 'DeleteObject' })
  .reply(204);

const mockS3ResponsesForBulkUploadProcessing = async (
  bulkUpload: BulkUpload,
  bulkUploadFilePath: string,
) => {
  const getRequest = await mockS3GetObjectReplyWithFile(
    bulkUpload.sourceKey,
    bulkUploadFilePath,
  );
  const copyRequest = await mockS3CopyObjectReply(
    `bulk-uploads/${bulkUpload.id}`,
  );
  const deleteRequest = await mockS3DeleteObjectReply(bulkUpload.sourceKey);
  return {
    getRequest,
    copyRequest,
    deleteRequest,
  };
};

const getProposalsByExternalIds = async (externalIds: string[]): Promise<Proposal[]> => {
  const { rows: proposals } = await db.sql<Proposal>(
    'proposals.selectWithPagination',
    {
      offset: 0,
      limit: 100,
      search: '',
    },
  );
  return externalIds.map((externalId) => {
    const proposal = proposals.find(
      (proposalCandidate) => proposalCandidate.externalId === externalId,
    );
    if (proposal === undefined) {
      throw new Error(`There is no proposal with externalId "${externalId}"`);
    }
    return proposal;
  });
};

describe('processBulkUpload', () => {
  it('should attempt to access the contents of the sourceKey associated with the specified bulk upload', async () => {
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const requests = await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
    );
    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    expect(requests.getRequest.isDone()).toEqual(true);
  });

  it('should attempt to copy the contents of the sourceKey associated with the specified bulk upload to a processed location', async () => {
    await createTestBaseFields();
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const requests = await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
    );
    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    expect(requests.copyRequest.isDone()).toEqual(true);
  });

  it('should attempt to delete the unprocessed file of the sourceKey associated with the specified bulk upload', async () => {
    await createTestBaseFields();
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const requests = await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
    );
    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    expect(requests.deleteRequest.isDone()).toEqual(true);
  });

  it('should set the status of the upload to FAILED if the sourceKey is not accessible', async () => {
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const sourceRequest = nock(await getS3Endpoint())
      .get(getS3KeyPath(sourceKey))
      .query({ 'x-id': 'GetObject' })
      .reply(404);

    await processBulkUpload(
      { bulkUploadId: bulkUpload.id },
      getMockJobHelpers(),
    );

    const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
    expect(updatedBulkUpload.status).toEqual(BulkUploadStatus.FAILED);
    expect(sourceRequest.isDone()).toEqual(true);
  });

  it('should set the status of the upload to FAILED if the csv does not have a proposal_submitter_email field', async () => {
    await createTestBaseFields();
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/missingEmail.csv`,
    );

    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
    expect(updatedBulkUpload.status).toEqual(BulkUploadStatus.FAILED);
  });

  it('should move the csv file to processed location if the csv does not have a proposal_submitter_email field', async () => {
    await createTestBaseFields();
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const requests = await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/missingEmail.csv`,
    );

    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    expect(requests.copyRequest.isDone()).toEqual(true);
    expect(requests.deleteRequest.isDone()).toEqual(true);
  });

  it('should set the status of the upload to FAILED if the csv contains an invalid short code', async () => {
    await createTestBaseFields();
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/invalidShortCode.csv`,
    );
    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
    expect(updatedBulkUpload.status).toEqual(BulkUploadStatus.FAILED);
  });

  it('should move the csv file to processed location if the csv contains an invalid short code', async () => {
    await createTestBaseFields();
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const requests = await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/invalidShortCode.csv`,
    );
    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    expect(requests.copyRequest.isDone()).toEqual(true);
    expect(requests.deleteRequest.isDone()).toEqual(true);
  });

  it('should set the status of the upload to FAILED if the csv is empty', async () => {
    await createTestBaseFields();
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/empty.csv`,
    );

    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
    expect(updatedBulkUpload.status).toEqual(BulkUploadStatus.FAILED);
  });

  it('should download, process, and resolve the bulk upload if the sourceKey is accessible and contains a valid CSV bulk upload', async () => {
    await createTestBaseFields();
    const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
    const bulkUpload = await createTestBulkUpload({ sourceKey });
    const requests = await mockS3ResponsesForBulkUploadProcessing(
      bulkUpload,
      `${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
    );

    await processBulkUpload(
      {
        bulkUploadId: bulkUpload.id,
      },
      getMockJobHelpers(),
    );
    const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
    const [firstProposal, secondProposal] = await getProposalsByExternalIds(
      ['1', '2'],
    );
    if (firstProposal === undefined) {
      fail('The first proposal was not created');
    }
    if (secondProposal === undefined) {
      fail('The second proposal was not created');
    }
    expect(firstProposal).toMatchObject({
      applicantId: 1,
      externalId: '1',
      opportunityId: 1,
      createdAt: expect.any(Date) as Date,
    });
    expect(secondProposal).toMatchObject({
      applicantId: 1,
      externalId: '2',
      opportunityId: 1,
      createdAt: expect.any(Date) as Date,
    });

    const { rows: proposalVersions } = await db.sql<ProposalVersion>(
      'proposalVersions.selectByProposalIds',
      { proposalIds: [1, 2] },
    );
    const firstProposalVersion = proposalVersions.find(
      (proposalVersion) => proposalVersion.proposalId === firstProposal.id,
    );
    const secondProposalVersion = proposalVersions.find(
      (proposalVersion) => proposalVersion.proposalId === secondProposal.id,
    );
    if (firstProposalVersion === undefined) {
      fail('The first proposal version was not created');
    }
    if (secondProposalVersion === undefined) {
      fail('The second proposal version was not created');
    }
    expect(firstProposalVersion).toMatchObject({
      applicationFormId: 1,
      proposalId: firstProposal.id,
      version: 1,
      createdAt: expect.any(Date) as Date,
    });
    expect(secondProposalVersion).toMatchObject({
      applicationFormId: 1,
      proposalId: secondProposal.id,
      version: 1,
      createdAt: expect.any(Date) as Date,
    });

    const { rows: firstProposalFieldValues } = await db.sql<ProposalFieldValue>(
      'proposalFieldValues.selectByProposalId',
      { proposalId: firstProposal.id },
    );
    const { rows: secondProposalFieldValues } = await db.sql<ProposalFieldValue>(
      'proposalFieldValues.selectByProposalId',
      { proposalId: secondProposal.id },
    );
    expect(firstProposalFieldValues).toMatchObject([
      {
        applicationFormFieldId: 1,
        position: 0,
        proposalVersionId: firstProposalVersion.id,
        value: 'foo@example.com',
        createdAt: expect.any(Date) as Date,
      },
      {
        applicationFormFieldId: 2,
        id: 2,
        position: 1,
        proposalVersionId: firstProposalVersion.id,
        value: 'Foo LLC.',
        createdAt: expect.any(Date) as Date,
      },
    ]);
    expect(secondProposalFieldValues).toMatchObject([
      {
        applicationFormFieldId: 1,
        position: 0,
        proposalVersionId: secondProposalVersion.id,
        value: 'foo@example.com',
        createdAt: expect.any(Date) as Date,
      },
      {
        applicationFormFieldId: 2,
        position: 1,
        proposalVersionId: secondProposalVersion.id,
        value: 'Bar Inc.',
        createdAt: expect.any(Date) as Date,
      },
    ]);
    expect(updatedBulkUpload.status).toEqual(BulkUploadStatus.COMPLETED);
    expect(requests.getRequest.isDone()).toEqual(true);
    expect(requests.copyRequest.isDone()).toEqual(true);
    expect(requests.deleteRequest.isDone()).toEqual(true);
  });
});
