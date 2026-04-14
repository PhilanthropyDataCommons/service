import path from 'node:path';
import fs from 'node:fs';
import { mockClient } from 'aws-sdk-client-mock';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@smithy/util-stream';
import {
	getDatabase,
	createOrUpdateBaseField,
	createApplicationForm,
	createApplicationFormField,
	loadBulkUploadTask,
	loadProposalBundle,
	createBulkUploadTask,
	loadSystemUser,
	loadChangemakerBundle,
	loadChangemakerProposalBundle,
	loadSystemSource,
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
	expectString,
	expectTimestamp,
} from '../../test/asymettricMatchers';
import { createTestFile, createTestOpportunity } from '../../test/factories';
import type { TinyPg } from 'tinypg';
import type {
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
	AuthContext,
	Opportunity,
} from '../../types';

const s3Mock = mockClient(S3Client);

const createTestApplicationForm = async (
	db: TinyPg,
	authContext: AuthContext,
	shortCodes: string[],
): Promise<{ applicationFormId: number; opportunity: Opportunity }> => {
	const opportunity = await createTestOpportunity(db, authContext);
	const applicationForm = await createApplicationForm(db, null, {
		opportunityId: opportunity.id,
		name: null,
	});
	await Promise.all(
		shortCodes.map(
			async (shortCode, index) =>
				await createApplicationFormField(db, null, {
					applicationFormId: applicationForm.id,
					baseFieldShortCode: shortCode,
					position: index,
					label: shortCode,
					instructions: null,
					inputType: null,
				}),
		),
	);
	return { applicationFormId: applicationForm.id, opportunity };
};

const createTestBulkUploadTask = async (
	db: TinyPg,
	authContext: AuthContext,
	options: {
		proposalsDataFileId: number;
		applicationFormId: number;
		overrideValues?: Partial<InternallyWritableBulkUploadTask>;
	},
): Promise<BulkUploadTask> => {
	const { proposalsDataFileId, applicationFormId, overrideValues } = options;
	const systemSource = await loadSystemSource(db, null);
	const defaultValues = {
		sourceId: systemSource.id,
		applicationFormId,
		attachmentsArchiveFileId: null,
		status: TaskStatus.PENDING,
	};
	return await createBulkUploadTask(db, authContext, {
		...defaultValues,
		...overrideValues,
		proposalsDataFileId,
	});
};

const createTestBaseFields = async (db: TinyPg): Promise<void> => {
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
		const db = getDatabase();
		await createTestBaseFields(db);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const { applicationFormId } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
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
			{
				bulkUploadId: bulkUploadTask.id,
			},
			getMockJobHelpers(),
		);

		expect(s3Mock.commandCalls(GetObjectCommand).length).toEqual(1);
	});

	it('should fail if the proposalsDataFile is not accessible', async () => {
		const db = getDatabase();
		await createTestBaseFields(db);
		const testAuthContext = await getTestAuthContext(db);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const { applicationFormId } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
			},
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
		const db = getDatabase();
		await createTestBaseFields(db);
		const testAuthContext = await getTestAuthContext(db);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const { applicationFormId } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
				overrideValues: {
					status: TaskStatus.IN_PROGRESS,
				},
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

	it('should fail if the csv does not match the application form fields', async () => {
		const db = getDatabase();
		await createTestBaseFields(db);
		const testAuthContext = await getTestAuthContext(db);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const { applicationFormId } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
			},
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
		const db = getDatabase();
		await createTestBaseFields(db);
		const testAuthContext = await getTestAuthContext(db);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const { applicationFormId } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
			},
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
		const db = getDatabase();
		await createTestBaseFields(db);
		const testAuthContext = await getTestAuthContext(db);
		const systemSource = await loadSystemSource(db, null);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const attachmentsArchiveFile = await createTestFile(
			db,
			systemUserAuthContext,
		);
		const { applicationFormId, opportunity } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name', 'favorite_file'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
				overrideValues: {
					attachmentsArchiveFileId: attachmentsArchiveFile.id,
				},
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
					opportunityId: 2,
					opportunity,
					versions: [
						{
							applicationFormId,
							createdAt: expectTimestamp(),
							createdBy: systemUser.keycloakUserId,
							fieldValues: [
								{
									applicationFormField: {
										applicationFormId,
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
										inputType: null,
										instructions: null,
										label: 'proposal_submitter_email',
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
									file: null,
								},
								{
									applicationFormField: {
										applicationFormId,
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
										inputType: null,
										instructions: null,
										label: 'organization_name',
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
									file: null,
								},
								{
									applicationFormField: {
										applicationFormId,
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
										inputType: null,
										instructions: null,
										label: 'favorite_file',
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
									file: { ...twoTxtFile, downloadUrl: expectString() },
								},
							],
							id: 2,
							proposalId: 2,
							sourceId: systemSource.id,
							source: systemSource,
							version: 1,
						},
					],
					changemakers: [],
				},
				{
					createdAt: expectTimestamp(),
					createdBy: systemUser.keycloakUserId,
					externalId: '1',
					id: 1,
					opportunityId: 2,
					opportunity,
					versions: [
						{
							applicationFormId,
							createdAt: expectTimestamp(),
							createdBy: systemUser.keycloakUserId,
							fieldValues: [
								{
									applicationFormField: {
										applicationFormId,
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
										inputType: null,
										instructions: null,
										label: 'proposal_submitter_email',
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
									file: null,
								},
								{
									applicationFormField: {
										applicationFormId,
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
										inputType: null,
										instructions: null,
										label: 'organization_name',
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
									file: null,
								},
								{
									applicationFormField: {
										applicationFormId,
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
										inputType: null,
										instructions: null,
										label: 'favorite_file',
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
									file: { ...oneTxtFile, downloadUrl: expectString() },
								},
							],
							id: 1,
							proposalId: 1,
							sourceId: systemSource.id,
							source: systemSource,
							version: 1,
						},
					],
					changemakers: [],
				},
			],
			total: 2,
		});

		const changemakerBundle = await loadChangemakerBundle(
			db,
			null,
			undefined,
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
		const db = getDatabase();
		await createTestBaseFields(db);
		const testAuthContext = await getTestAuthContext(db);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const { applicationFormId } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name', 'organization_tax_id'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
			},
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
					createdBy: systemUser.keycloakUserId,
					taxId: '51-2144346',
					id: 1,
					name: 'Foo LLC.',
					keycloakOrganizationId: null,
					fields: [],
					fiscalSponsors: [],
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

	it('should resolve file attachment paths when archive has a single root folder and CSV uses stripped paths', async () => {
		const db = getDatabase();
		await createTestBaseFields(db);
		const testAuthContext = await getTestAuthContext(db);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const attachmentsArchiveFile = await createTestFile(
			db,
			systemUserAuthContext,
		);
		const { applicationFormId } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name', 'favorite_file'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
				overrideValues: {
					attachmentsArchiveFileId: attachmentsArchiveFile.id,
				},
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
							'validCsvTemplateWithNestedArchive.csv',
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
							'attachments-nested-root-folder.zip',
						),
					),
				),
			});

		await processBulkUploadTask(
			{ bulkUploadId: bulkUploadTask.id },
			getMockJobHelpers(),
		);

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
		expect(updatedBulkUploadTask.status).toEqual(TaskStatus.COMPLETED);
	});

	it('should resolve file attachment paths when archive has a single root folder and CSV uses full paths', async () => {
		const db = getDatabase();
		await createTestBaseFields(db);
		const testAuthContext = await getTestAuthContext(db);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);
		const proposalsDataFile = await createTestFile(db, systemUserAuthContext);
		const attachmentsArchiveFile = await createTestFile(
			db,
			systemUserAuthContext,
		);
		const { applicationFormId } = await createTestApplicationForm(
			db,
			systemUserAuthContext,
			['proposal_submitter_email', 'organization_name', 'favorite_file'],
		);
		const bulkUploadTask = await createTestBulkUploadTask(
			db,
			systemUserAuthContext,
			{
				proposalsDataFileId: proposalsDataFile.id,
				applicationFormId,
				overrideValues: {
					attachmentsArchiveFileId: attachmentsArchiveFile.id,
				},
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
							'validCsvTemplateWithNestedArchiveFullPaths.csv',
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
							'attachments-nested-root-folder.zip',
						),
					),
				),
			});

		await processBulkUploadTask(
			{ bulkUploadId: bulkUploadTask.id },
			getMockJobHelpers(),
		);

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
		expect(updatedBulkUploadTask.status).toEqual(TaskStatus.COMPLETED);
	});
});
