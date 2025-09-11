import path from 'node:path';
import nock from 'nock';
import { requireEnv } from 'require-env-variable';
import {
	db,
	createOrUpdateBaseField,
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
import { getS3Client } from '../../s3';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processBulkUploadTask } from '../processBulkUploadTask';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	TaskStatus,
	BaseFieldSensitivityClassification,
} from '../../types';
import {
	getAuthContext,
	getTestAuthContext,
	NO_LIMIT,
	NO_OFFSET,
} from '../../test/utils';
import {
	expectNumber,
	expectObject,
	expectTimestamp,
} from '../../test/asymettricMatchers';
import { createTestFile } from '../../test/factories';
import type {
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
	AuthContext,
	File,
} from '../../types';

const { S3_PATH_STYLE } = requireEnv('S3_PATH_STYLE');

const getS3Endpoint = async (endpoint: string, bucketName: string) => {
	const s3Client = getS3Client({ endpoint });
	if (s3Client.config.endpoint === undefined) {
		throw new Error('The S3 client is not configured with an endpoint');
	}
	const { hostname, protocol } = await s3Client.config.endpoint();
	return S3_PATH_STYLE === 'true'
		? `${protocol}//${hostname}`
		: `${protocol}//${bucketName}.${hostname}`;
};

const getS3Path = (bucketName: string) =>
	S3_PATH_STYLE === 'true' ? `/${bucketName}` : '';

const getS3KeyPath = (bucketName: string, objectKey: string) =>
	`${getS3Path(bucketName)}/${objectKey}`;

const createTestBulkUploadTask = async (
	authContext: AuthContext,
	proposalsDataFileId: number,
	overrideValues?: Partial<InternallyWritableBulkUploadTask>,
): Promise<BulkUploadTask> => {
	const systemSource = await loadSystemSource(db, null);
	const systemFunder = await loadSystemFunder(db, null);
	const defaultValues = {
		sourceId: systemSource.id,
		funderShortCode: systemFunder.shortCode,
		status: TaskStatus.PENDING,
	};
	return await createBulkUploadTask(db, authContext, {
		...defaultValues,
		...overrideValues,
		proposalsDataFileId,
	});
};

const createTestBaseFields = async (): Promise<void> => {
	await createOrUpdateBaseField(db, null, {
		label: 'Proposal Submitter Email',
		description: 'The email address of the person who submitted the proposal.',
		shortCode: 'proposal_submitter_email',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
	await createOrUpdateBaseField(db, null, {
		label: 'Organization Name',
		description: 'The name of the applying organization.',
		shortCode: 'organization_name',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.ORGANIZATION,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
	await createOrUpdateBaseField(db, null, {
		label: 'Organization EIN',
		description: 'The name of the applying organization.',
		shortCode: 'organization_tax_id',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.ORGANIZATION,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
};

const mockS3GetObjectReplyWithFile = async (file: File, filePath: string) =>
	nock(await getS3Endpoint(file.s3Bucket.endpoint, file.s3Bucket.name))
		.get(getS3KeyPath(file.s3Bucket.name, file.storageKey))
		.query({ 'x-id': 'GetObject' })
		.replyWithFile(200, filePath);

const mockS3ResponsesForBulkUploadTaskProcessing = async (
	bulkUploadTask: BulkUploadTask,
	bulkUploadFilePath: string,
) => {
	const getRequest = await mockS3GetObjectReplyWithFile(
		bulkUploadTask.proposalsDataFile,
		bulkUploadFilePath,
	);
	return {
		getRequest,
	};
};

describe('processBulkUploadTask', () => {
	it('should attempt to access the contents of the file associated with the specified bulk upload', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
		);
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			path.join(
				__dirname,
				'fixtures',
				'processBulkUploadTask',
				'validCsvTemplate.csv',
			),
		);
		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);
		expect(requests.getRequest.isDone()).toEqual(true);
	});

	it('should fail if the proposalsDataFile is not accessible', async () => {
		const testAuthContext = await getTestAuthContext();
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
		);
		const sourceRequest = nock(
			await getS3Endpoint(
				proposalsDataFile.s3Bucket.endpoint,
				proposalsDataFile.s3Bucket.name,
			),
		)
			.get(
				getS3KeyPath(
					proposalsDataFile.s3Bucket.name,
					proposalsDataFile.storageKey,
				),
			)
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
		});
		expect(sourceRequest.isDone()).toEqual(true);
	});

	it('should not process or modify processing status if the bulk upload is not PENDING', async () => {
		const testAuthContext = await getTestAuthContext();
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
			{
				status: TaskStatus.IN_PROGRESS,
			},
		);
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			path.join(
				__dirname,
				'fixtures',
				'processBulkUploadTask',
				'validCsvTemplate.csv',
			),
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
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
		);
		await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			path.join(
				__dirname,
				'fixtures',
				'processBulkUploadTask',
				'invalidShortCode.csv',
			),
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
		});
	});

	it('should have a proper failed state if the csv is empty', async () => {
		await createTestBaseFields();
		const testAuthContext = await getTestAuthContext();
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
		);
		await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			path.join(__dirname, 'fixtures', 'processBulkUploadTask', 'empty.csv'),
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
		});
	});

	it('should download, process, and resolve the bulk upload if the sourceKey is accessible and contains a valid CSV bulk upload', async () => {
		await createTestBaseFields();
		const testAuthContext = await getTestAuthContext();
		const systemSource = await loadSystemSource(db, null);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
		);
		const requests = await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			path.join(
				__dirname,
				'fixtures',
				'processBulkUploadTask',
				'validCsvTemplate.csv',
			),
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
		} = await loadOpportunityBundle(db, testAuthContext, NO_LIMIT, NO_OFFSET);
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
			createdAt: expectTimestamp(),
		});

		const proposalBundle = await loadProposalBundle(
			db,
			testAuthContext,
			undefined,
			undefined,
			undefined,
			undefined,
			NO_LIMIT,
			NO_OFFSET,
		);
		expect(proposalBundle).toEqual({
			entries: [
				{
					createdAt: expectTimestamp(),
					createdBy: systemUser.keycloakUserId,
					externalId: '2',
					id: 2,
					opportunityId: 1,
					opportunity,
					versions: [
						{
							applicationFormId: 1,
							createdAt: expectTimestamp(),
							createdBy: systemUser.keycloakUserId,
							fieldValues: [
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp(),
											dataType: 'string',
											description:
												'The email address of the person who submitted the proposal.',
											label: 'Proposal Submitter Email',
											category: 'project',
											valueRelevanceHours: null,
											shortCode: 'proposal_submitter_email',
											sensitivityClassification:
												BaseFieldSensitivityClassification.RESTRICTED,
											localizations: {},
										},
										baseFieldShortCode: 'proposal_submitter_email',
										createdAt: expectTimestamp(),
										id: expectNumber(),
										instructions: null,
										label: 'Proposal Submitter Email',
										position: 0,
									},
									applicationFormFieldId: expectNumber(),
									createdAt: expectTimestamp(),
									id: expectNumber(),
									isValid: true,
									goodAsOf: null,
									position: 0,
									proposalVersionId: 2,
									value: 'foo@example.com',
								},
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp(),
											dataType: 'string',
											description: 'The name of the applying organization.',
											label: 'Organization Name',
											category: 'organization',
											valueRelevanceHours: null,
											sensitivityClassification:
												BaseFieldSensitivityClassification.RESTRICTED,
											shortCode: 'organization_name',
											localizations: {},
										},
										baseFieldShortCode: 'organization_name',
										createdAt: expectTimestamp(),
										id: expectNumber(),
										instructions: null,
										label: 'Organization Name',
										position: 1,
									},
									applicationFormFieldId: expectNumber(),
									createdAt: expectTimestamp(),
									id: expectNumber(),
									isValid: true,
									goodAsOf: null,
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
					createdAt: expectTimestamp(),
					createdBy: systemUser.keycloakUserId,
					externalId: '1',
					id: 1,
					opportunityId: 1,
					opportunity: expectObject(),
					versions: [
						{
							applicationFormId: 1,
							createdAt: expectTimestamp(),
							createdBy: systemUser.keycloakUserId,
							fieldValues: [
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp(),
											dataType: 'string',
											description:
												'The email address of the person who submitted the proposal.',
											label: 'Proposal Submitter Email',
											category: 'project',
											valueRelevanceHours: null,
											sensitivityClassification:
												BaseFieldSensitivityClassification.RESTRICTED,
											shortCode: 'proposal_submitter_email',
											localizations: {},
										},
										baseFieldShortCode: 'proposal_submitter_email',
										createdAt: expectTimestamp(),
										id: expectNumber(),
										instructions: null,
										label: 'Proposal Submitter Email',
										position: 0,
									},
									applicationFormFieldId: expectNumber(),
									createdAt: expectTimestamp(),
									id: expectNumber(),
									isValid: true,
									goodAsOf: null,
									position: 0,
									proposalVersionId: 1,
									value: 'foo@example.com',
								},
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp(),
											dataType: 'string',
											description: 'The name of the applying organization.',
											label: 'Organization Name',
											category: 'organization',
											valueRelevanceHours: null,
											sensitivityClassification:
												BaseFieldSensitivityClassification.RESTRICTED,
											shortCode: 'organization_name',
											localizations: {},
										},
										baseFieldShortCode: 'organization_name',
										createdAt: expectTimestamp(),
										id: expectNumber(),
										instructions: null,
										label: 'Organization Name',
										position: 1,
									},
									applicationFormFieldId: expectNumber(),
									createdAt: expectTimestamp(),
									id: expectNumber(),
									isValid: true,
									goodAsOf: null,
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
	});

	it('should create changemakers and changemaker-proposal relationships', async () => {
		await createTestBaseFields();
		const testAuthContext = await getTestAuthContext();
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
		);
		await mockS3ResponsesForBulkUploadTaskProcessing(
			bulkUploadTask,
			path.join(
				__dirname,
				'fixtures',
				'processBulkUploadTask',
				'validCsvTemplateWithChangemakers.csv',
			),
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
					createdAt: expectTimestamp(),
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
					createdAt: expectTimestamp(),
					id: 2,
					changemakerId: 1,
					proposalId: 2,
					changemaker: expectObject(),
					proposal: expectObject(),
				},
				{
					createdAt: expectTimestamp(),
					id: 1,
					changemakerId: 1,
					proposalId: 1,
					changemaker: expectObject(),
					proposal: expectObject(),
				},
			],
			total: 2,
		});
	});
});
