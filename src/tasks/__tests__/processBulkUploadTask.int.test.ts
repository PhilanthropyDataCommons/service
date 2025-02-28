import nock from 'nock';
import { requireEnv } from 'require-env-variable';
import {
	db,
	createBaseField,
	loadBulkUploadTask,
	loadProposalBundle,
	loadApplicationFormBundle,
	createBulkUploadTask,
	loadSystemUser,
	loadChangemakerBundle,
	loadChangemakerProposalBundle,
	loadOpportunityBundle,
	loadSystemSource,
	loadSystemFunder,
} from '../../database';
import { s3Client } from '../../s3Client';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processBulkUploadTask } from '../processBulkUploadTask';
import {
	BaseFieldDataType,
	BaseFieldScope,
	TaskStatus,
	Proposal,
} from '../../types';
import {
	expectTimestamp,
	getTestAuthContext,
	NO_LIMIT,
	NO_OFFSET,
} from '../../test/utils';
import type {
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
	Changemaker,
} from '../../types';

const { S3_BUCKET, S3_PATH_STYLE } = requireEnv('S3_BUCKET', 'S3_PATH_STYLE');

const TEST_UNPROCESSED_SOURCE_KEY =
	'unprocessed/550e8400-e29b-41d4-a716-446655440000';
const TEST_BULK_UPLOAD_SOURCE_KEY = 'bulk-upload/1';

const getS3Endpoint = async () => {
	if (s3Client.config.endpoint === undefined) {
		throw new Error('The S3 client is not configured with an endpoint');
	}
	const { hostname, protocol } = await s3Client.config.endpoint();
	return S3_PATH_STYLE === 'true'
		? `${protocol}//${hostname}`
		: `${protocol}//${S3_BUCKET}.${hostname}`;
};

const getS3Path = () => (S3_PATH_STYLE === 'true' ? `/${S3_BUCKET}` : '');

const getS3KeyPath = (key: string) => `${getS3Path()}/${key}`;

const createTestBulkUploadTask = async (
	overrideValues?: Partial<InternallyWritableBulkUploadTask>,
): Promise<BulkUploadTask> => {
	const systemUser = await loadSystemUser(db, null);
	const systemSource = await loadSystemSource(db, null);
	const systemFunder = await loadSystemFunder(db, null);
	const defaultValues = {
		fileName: 'bar.csv',
		sourceId: systemSource.id,
		funderShortCode: systemFunder.shortCode,
		sourceKey: TEST_UNPROCESSED_SOURCE_KEY,
		status: TaskStatus.PENDING,
		createdBy: systemUser.keycloakUserId,
	};
	return createBulkUploadTask(db, null, {
		...defaultValues,
		...overrideValues,
	});
};

const createTestBaseFields = async (): Promise<void> => {
	await createBaseField(db, null, {
		label: 'Proposal Submitter Email',
		description: 'The email address of the person who submitted the proposal.',
		shortCode: 'proposal_submitter_email',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});
	await createBaseField(db, null, {
		label: 'Organization Name',
		description: 'The name of the applying organization.',
		shortCode: 'organization_name',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.ORGANIZATION,
	});
	await createBaseField(db, null, {
		label: 'Organization EIN',
		description: 'The name of the applying organization.',
		shortCode: 'organization_tax_id',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.ORGANIZATION,
	});
};

const mockS3GetObjectReplyWithFile = async (
	sourceKey: string,
	filePath: string,
) =>
	nock(await getS3Endpoint())
		.get(getS3KeyPath(sourceKey))
		.query({ 'x-id': 'GetObject' })
		.replyWithFile(200, filePath);

const mockS3CopyObjectReply = async (sourceKey: string) =>
	nock(await getS3Endpoint())
		.put(getS3KeyPath(`${sourceKey}`))
		.query({ 'x-id': 'CopyObject' })
		.reply(
			200,
			'<?xml version="1.0" encoding="UTF-8"?><CopyObjectResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LastModified>2024-01-02T19:24:50.814Z</LastModified><ETag>745905cba4f8bfd2394f34e61d035a36</ETag></CopyObjectResult>',
		);

const mockS3DeleteObjectReply = async (sourceKey: string) =>
	nock(await getS3Endpoint())
		.delete(getS3KeyPath(`${sourceKey}`))
		.query({ 'x-id': 'DeleteObject' })
		.reply(204);

const mockS3ResponsesForBulkUploadTaskProcessing = async (
	bulkUploadTask: BulkUploadTask,
	bulkUploadFilePath: string,
) => {
	const getRequest = await mockS3GetObjectReplyWithFile(
		bulkUploadTask.sourceKey,
		bulkUploadFilePath,
	);
	const copyRequest = await mockS3CopyObjectReply(
		`bulk-uploads/${bulkUploadTask.id}`,
	);
	const deleteRequest = await mockS3DeleteObjectReply(bulkUploadTask.sourceKey);
	return {
		getRequest,
		copyRequest,
		deleteRequest,
	};
};

describe('processBulkUploadTask', () => {
	it('should attempt to access the contents of the sourceKey associated with the specified bulk upload', async () => {
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/validCsvTemplate.csv`,
		);
		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		expect(requests.getRequest.isDone()).toEqual(true);
	});

	it('should attempt to copy the contents of the sourceKey associated with the specified bulk upload to a processed location', async () => {
		await createTestBaseFields();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/validCsvTemplate.csv`,
		);
		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		expect(requests.copyRequest.isDone()).toEqual(true);
	});

	it('should attempt to delete the unprocessed file of the sourceKey associated with the specified bulk upload', async () => {
		await createTestBaseFields();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/validCsvTemplate.csv`,
		);
		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		expect(requests.deleteRequest.isDone()).toEqual(true);
	});

	it('should fail if the sourceKey is not accessible', async () => {
		const testAuthContext = await getTestAuthContext();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		const sourceRequest = nock(await getS3Endpoint())
			.get(getS3KeyPath(sourceKey))
			.query({ 'x-id': 'GetObject' })
			.reply(404);

		await processBulkUploadTask(
			{ bulkUploadId: bulkUploadTask.id },
			getMockJobHelpers(),
		);

		const updatedBulkUploadTask = await loadBulkUploadTask(
			db,
			testAuthContext,
			bulkUploadTask.id,
		);
		expect(updatedBulkUploadTask).toMatchObject({
			status: TaskStatus.FAILED,
			fileSize: null,
		});
		expect(sourceRequest.isDone()).toEqual(true);
	});

	it('should not process, and fail, if the sourceKey is not in the unprocessed namespace', async () => {
		const testAuthContext = await getTestAuthContext();
		const sourceKey = TEST_BULK_UPLOAD_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/validCsvTemplate.csv`,
		);

		await processBulkUploadTask(
			{ bulkUploadId: bulkUploadTask.id },
			getMockJobHelpers(),
		);

		const updatedBulkUpload = await loadBulkUploadTask(
			db,
			testAuthContext,
			bulkUploadTask.id,
		);
		expect(updatedBulkUpload).toMatchObject({
			status: TaskStatus.FAILED,
			fileSize: null,
		});
		expect(requests.getRequest.isDone()).toEqual(false);
	});

	it('should not process or modify processing status if the bulk upload is not PENDING', async () => {
		const testAuthContext = await getTestAuthContext();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({
			sourceKey,
			status: TaskStatus.IN_PROGRESS,
		});
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/validCsvTemplate.csv`,
		);

		await processBulkUploadTask(
			{ bulkUploadId: bulkUploadTask.id },
			getMockJobHelpers(),
		);

		const updatedBulkUpload = await loadBulkUploadTask(
			db,
			testAuthContext,
			bulkUploadTask.id,
		);
		expect(updatedBulkUpload.status).toEqual(TaskStatus.IN_PROGRESS);
		expect(requests.getRequest.isDone()).toEqual(false);
	});

	it('should fail if the csv contains an invalid short code', async () => {
		await createTestBaseFields();
		const testAuthContext = await getTestAuthContext();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/invalidShortCode.csv`,
		);
		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		const updatedBulkUploadTask = await loadBulkUploadTask(
			db,
			testAuthContext,
			bulkUploadTask.id,
		);
		expect(updatedBulkUploadTask).toMatchObject({
			status: TaskStatus.FAILED,
			fileSize: 97,
		});
	});

	it('should move the csv file to processed location if the csv contains an invalid short code', async () => {
		await createTestBaseFields();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/invalidShortCode.csv`,
		);
		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		expect(requests.copyRequest.isDone()).toEqual(true);
		expect(requests.deleteRequest.isDone()).toEqual(true);
	});

	it('should have a proper failed state if the csv is empty', async () => {
		await createTestBaseFields();
		const testAuthContext = await getTestAuthContext();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/empty.csv`,
		);

		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		const updatedBulkUpload = await loadBulkUploadTask(
			db,
			testAuthContext,
			bulkUploadTask.id,
		);
		expect(updatedBulkUpload).toMatchObject({
			status: TaskStatus.FAILED,
			fileSize: 0,
		});
	});

	it('should update the file size for the bulk upload if the sourceKey is accessible and contains a valid CSV', async () => {
		await createTestBaseFields();
		const testAuthContext = await getTestAuthContext();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/validCsvTemplate.csv`,
		);
		expect(bulkUploadTask.fileSize).toBe(null);

		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		const updatedBulkUploadTask = await loadBulkUploadTask(
			db,
			testAuthContext,
			bulkUploadTask.id,
		);
		expect(updatedBulkUploadTask).toMatchObject({
			fileSize: 93,
		});
	});

	it('should download, process, and resolve the bulk upload if the sourceKey is accessible and contains a valid CSV bulk upload', async () => {
		await createTestBaseFields();
		const testAuthContext = await getTestAuthContext();
		const systemSource = await loadSystemSource(db, null);
		const systemUser = await loadSystemUser(db, null);
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({
			sourceKey,
			createdBy: systemUser.keycloakUserId,
		});
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/validCsvTemplate.csv`,
		);

		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		const updatedBulkUploadTask = await loadBulkUploadTask(
			db,
			testAuthContext,
			bulkUploadTask.id,
		);

		const {
			entries: [opportunity],
		} = await loadOpportunityBundle(db, null, NO_LIMIT, NO_OFFSET);
		if (opportunity === undefined) {
			throw new Error('The opportunity was not created');
		}

		const {
			entries: [applicationForm],
		} = await loadApplicationFormBundle(
			db,
			testAuthContext,
			NO_LIMIT,
			NO_OFFSET,
		);
		if (applicationForm === undefined) {
			throw new Error('The application form was not created');
		}
		expect(applicationForm).toMatchObject({
			opportunityId: opportunity.id,
			version: 1,
			createdAt: expectTimestamp,
		});

		const proposalBundle = await loadProposalBundle(
			db,
			null,
			undefined,
			undefined,
			undefined,
			NO_LIMIT,
			NO_OFFSET,
		);
		expect(proposalBundle).toEqual({
			entries: [
				{
					createdAt: expectTimestamp,
					createdBy: systemUser.keycloakUserId,
					externalId: '2',
					id: 2,
					opportunityId: 1,
					versions: [
						{
							applicationFormId: 1,
							createdAt: expectTimestamp,
							createdBy: systemUser.keycloakUserId,
							fieldValues: [
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp,
											dataType: 'string',
											description:
												'The email address of the person who submitted the proposal.',
											id: 1,
											label: 'Proposal Submitter Email',
											scope: 'proposal',
											shortCode: 'proposal_submitter_email',
											localizations: {},
										},
										baseFieldId: 1,
										createdAt: expectTimestamp,
										id: expect.any(Number) as number,
										label: 'Proposal Submitter Email',
										position: 0,
									},
									applicationFormFieldId: expect.any(Number) as number,
									createdAt: expectTimestamp,
									id: expect.any(Number) as number,
									isValid: true,
									position: 0,
									proposalVersionId: 2,
									value: 'foo@example.com',
								},
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp,
											dataType: 'string',
											description: 'The name of the applying organization.',
											id: 2,
											label: 'Organization Name',
											scope: 'organization',
											shortCode: 'organization_name',
											localizations: {},
										},
										baseFieldId: 2,
										createdAt: expectTimestamp,
										id: expect.any(Number) as number,
										label: 'Organization Name',
										position: 1,
									},
									applicationFormFieldId: expect.any(Number) as number,
									createdAt: expectTimestamp,
									id: expect.any(Number) as number,
									isValid: true,
									position: 1,
									proposalVersionId: 2,
									value: 'Bar Inc.',
								},
							],
							id: 2,
							proposalId: 2,
							sourceId: systemSource.id,
							source: systemSource,
							version: 1,
						},
					],
				},
				{
					createdAt: expectTimestamp,
					createdBy: systemUser.keycloakUserId,
					externalId: '1',
					id: 1,
					opportunityId: 1,
					versions: [
						{
							applicationFormId: 1,
							createdAt: expectTimestamp,
							createdBy: systemUser.keycloakUserId,
							fieldValues: [
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp,
											dataType: 'string',
											description:
												'The email address of the person who submitted the proposal.',
											id: 1,
											label: 'Proposal Submitter Email',
											scope: 'proposal',
											shortCode: 'proposal_submitter_email',
											localizations: {},
										},
										baseFieldId: 1,
										createdAt: expectTimestamp,
										id: expect.any(Number) as number,
										label: 'Proposal Submitter Email',
										position: 0,
									},
									applicationFormFieldId: expect.any(Number) as number,
									createdAt: expectTimestamp,
									id: expect.any(Number) as number,
									isValid: true,
									position: 0,
									proposalVersionId: 1,
									value: 'foo@example.com',
								},
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp,
											dataType: 'string',
											description: 'The name of the applying organization.',
											id: 2,
											label: 'Organization Name',
											scope: 'organization',
											shortCode: 'organization_name',
											localizations: {},
										},
										baseFieldId: 2,
										createdAt: expectTimestamp,
										id: expect.any(Number) as number,
										label: 'Organization Name',
										position: 1,
									},
									applicationFormFieldId: expect.any(Number) as number,
									createdAt: expectTimestamp,
									id: expect.any(Number) as number,
									isValid: true,
									position: 1,
									proposalVersionId: 1,
									value: 'Foo LLC.',
								},
							],
							id: 1,
							proposalId: 1,
							sourceId: systemSource.id,
							source: systemSource,
							version: 1,
						},
					],
				},
			],
			total: 2,
		});

		const changemakerBundle = await loadChangemakerBundle(
			db,
			null,
			undefined,
			NO_LIMIT,
			NO_OFFSET,
		);
		expect(changemakerBundle).toEqual({
			entries: [],
			total: 0,
		});

		const changemakerProposalBundle = await loadChangemakerProposalBundle(
			db,
			null,
			undefined,
			undefined,
			NO_LIMIT,
			NO_OFFSET,
		);
		expect(changemakerProposalBundle).toEqual({
			entries: [],
			total: 0,
		});

		expect(updatedBulkUploadTask.status).toEqual(TaskStatus.COMPLETED);
		expect(requests.getRequest.isDone()).toEqual(true);
		expect(requests.copyRequest.isDone()).toEqual(true);
		expect(requests.deleteRequest.isDone()).toEqual(true);
	});

	it('should create changemakers and changemaker-proposal relationships', async () => {
		await createTestBaseFields();
		const testAuthContext = await getTestAuthContext();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUploadTask = await createTestBulkUploadTask({ sourceKey });
		await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			`${__dirname}/fixtures/processBulkUploadTask/validCsvTemplateWithChangemakers.csv`,
		);

		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);

		const changemakerBundle = await loadChangemakerBundle(
			db,
			null,
			undefined,
			NO_LIMIT,
			NO_OFFSET,
		);

		const changemakerProposalBundle = await loadChangemakerProposalBundle(
			db,
			testAuthContext,
			undefined,
			undefined,
			NO_LIMIT,
			NO_OFFSET,
		);

		expect(changemakerBundle).toEqual({
			entries: [
				{
					createdAt: expectTimestamp,
					taxId: '51-2144346',
					id: 1,
					name: 'Foo LLC.',
					keycloakOrganizationId: null,
					fiscalSponsors: [],
					fields: [],
				},
			],
			total: 1,
		});
		expect(changemakerProposalBundle).toEqual({
			entries: [
				{
					createdAt: expectTimestamp,
					id: 2,
					changemakerId: 1,
					proposalId: 2,
					changemaker: expect.any(Object) as Changemaker,
					proposal: expect.any(Object) as Proposal,
				},
				{
					createdAt: expectTimestamp,
					id: 1,
					changemakerId: 1,
					proposalId: 1,
					changemaker: expect.any(Object) as Changemaker,
					proposal: expect.any(Object) as Proposal,
				},
			],
			total: 2,
		});
	});
});
