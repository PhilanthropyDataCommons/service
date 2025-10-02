import path from 'node:path';
import fs from 'node:fs';
import { mockClient } from 'aws-sdk-client-mock';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@smithy/util-stream';
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
	loadFileBundle,
} from '../../database';
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
} from '../../types';

const s3Mock = mockClient(S3Client);

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
		attachmentsArchiveFileId: null,
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
	await createOrUpdateBaseField(db, null, {
		label: 'Favorite File',
		description: 'Just a file we want to attach.',
		shortCode: 'favorite_file',
		dataType: BaseFieldDataType.FILE,
		category: BaseFieldCategory.ORGANIZATION,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
};

describe('processBulkUploadTask', () => {
	beforeEach(() => {
		s3Mock.reset();
	});
	it('should attempt to access the contents of the file associated with the specified bulk upload', async () => {
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
		);

		s3Mock.on(GetObjectCommand).resolves({
			Body: sdkStreamMixin(
				fs.createReadStream(
					path.join(
						__dirname,
						'fixtures',
						'processBulkUploadTask',
						'validCsvTemplate.csv',
					),
				),
			),
		});

		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);

		expect(s3Mock.commandCalls(GetObjectCommand).length).toEqual(1);
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

		s3Mock.on(GetObjectCommand).rejects(new Error('NoSuchKey'));

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
		expect(updatedBulkUploadTask).toHaveProperty('logs');
		expect(updatedBulkUploadTask.logs.length).toBeGreaterThan(0);
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

		s3Mock.on(GetObjectCommand).resolves({
			Body: sdkStreamMixin(
				fs.createReadStream(
					path.join(
						__dirname,
						'fixtures',
						'processBulkUploadTask',
						'validCsvTemplate.csv',
					),
				),
			),
		});

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
		expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(0);
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

		s3Mock.on(GetObjectCommand).resolves({
			Body: sdkStreamMixin(
				fs.createReadStream(
					path.join(
						__dirname,
						'fixtures',
						'processBulkUploadTask',
						'invalidShortCode.csv',
					),
				),
			),
		});

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
		expect(updatedBulkUploadTask).toHaveProperty('logs');
		expect(updatedBulkUploadTask.logs.length).toBeGreaterThan(0);
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

		s3Mock.on(GetObjectCommand).resolves({
			Body: sdkStreamMixin(
				fs.createReadStream(
					path.join(
						__dirname,
						'fixtures',
						'processBulkUploadTask',
						'empty.csv',
					),
				),
			),
		});

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
		const attachmentsArchiveFile = await createTestFile(
			db,
			systemUserAuthContext,
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			systemUserAuthContext,
			proposalsDataFile.id,
			{
				attachmentsArchiveFileId: attachmentsArchiveFile.id,
			},
		);

		s3Mock
			.on(GetObjectCommand, { Key: proposalsDataFile.storageKey })
			.resolves({
				Body: sdkStreamMixin(
					fs.createReadStream(
						path.join(
							__dirname,
							'fixtures',
							'processBulkUploadTask',
							'validCsvTemplateWithFile.csv',
						),
					),
				),
			});

		s3Mock
			.on(GetObjectCommand, { Key: attachmentsArchiveFile.storageKey })
			.resolves({
				Body: sdkStreamMixin(
					fs.createReadStream(
						path.join(
							__dirname,
							'fixtures',
							'processBulkUploadTask',
							'attachments.zip',
						),
					),
				),
			});

		await processBulkUploadTask(
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);

		expect(s3Mock.commandCalls(GetObjectCommand).length).toEqual(2);

		const fileBundle = await loadFileBundle(
			db,
			testAuthContext,
			systemUser.keycloakUserId,
			NO_LIMIT,
			NO_OFFSET,
		);
		const oneTxtFile = fileBundle.entries.find((f) => f.name === 'one.txt');
		const twoTxtFile = fileBundle.entries.find((f) => f.name === 'two.txt');
		if (oneTxtFile === undefined || twoTxtFile === undefined) {
			throw new Error('The attachment files were not created');
		}

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
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp(),
											dataType: 'file',
											description: 'Just a file we want to attach.',
											label: 'Favorite File',
											category: 'organization',
											valueRelevanceHours: null,
											sensitivityClassification:
												BaseFieldSensitivityClassification.RESTRICTED,
											shortCode: 'favorite_file',
											localizations: {},
										},
										baseFieldShortCode: 'favorite_file',
										createdAt: expectTimestamp(),
										id: expectNumber(),
										instructions: null,
										label: 'Favorite File',
										position: 2,
									},
									applicationFormFieldId: expectNumber(),
									createdAt: expectTimestamp(),
									id: expectNumber(),
									isValid: true,
									goodAsOf: null,
									position: 2,
									proposalVersionId: 2,
									value: twoTxtFile.id.toString(),
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
								{
									applicationFormField: {
										applicationFormId: 1,
										baseField: {
											createdAt: expectTimestamp(),
											dataType: 'file',
											description: 'Just a file we want to attach.',
											label: 'Favorite File',
											category: 'organization',
											valueRelevanceHours: null,
											sensitivityClassification:
												BaseFieldSensitivityClassification.RESTRICTED,
											shortCode: 'favorite_file',
											localizations: {},
										},
										baseFieldShortCode: 'favorite_file',
										createdAt: expectTimestamp(),
										id: expectNumber(),
										instructions: null,
										label: 'Favorite File',
										position: 2,
									},
									applicationFormFieldId: expectNumber(),
									createdAt: expectTimestamp(),
									id: expectNumber(),
									isValid: true,
									goodAsOf: null,
									position: 2,
									proposalVersionId: 1,
									value: oneTxtFile.id.toString(),
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

		s3Mock.on(GetObjectCommand).resolves({
			Body: sdkStreamMixin(
				fs.createReadStream(
					path.join(
						__dirname,
						'fixtures',
						'processBulkUploadTask',
						'validCsvTemplateWithChangemakers.csv',
					),
				),
			),
		});

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
