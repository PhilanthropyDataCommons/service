import nock from 'nock';
import { requireEnv } from 'require-env-variable';
import {
	db,
	createBaseField,
	loadBulkUpload,
	loadProposalBundle,
	loadApplicationFormFieldBundle,
	loadApplicationFormBundle,
	createBulkUpload,
	loadSystemUser,
} from '../../database';
import { s3Client } from '../../s3Client';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { processBulkUpload } from '../processBulkUpload';
import { BaseFieldDataType, BulkUploadStatus, Proposal } from '../../types';
import { expectTimestamp } from '../../test/utils';
import type {
	ApplicationFormField,
	BaseField,
	BulkUpload,
	InternallyWritableBulkUpload,
	Opportunity,
	ProposalFieldValue,
	ProposalVersion,
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

const createTestBulkUpload = async (
	overrideValues?: Partial<InternallyWritableBulkUpload>,
): Promise<BulkUpload> => {
	const systemUser = await loadSystemUser();
	const defaultValues = {
		fileName: 'bar.csv',
		sourceKey: TEST_UNPROCESSED_SOURCE_KEY,
		status: BulkUploadStatus.PENDING,
		createdBy: systemUser.id,
	};
	return createBulkUpload({
		...defaultValues,
		...overrideValues,
	});
};

const createTestBaseFields = async (): Promise<[BaseField, BaseField]> => {
	const proposalSubmitterEmailBaseField = await createBaseField({
		label: 'Proposal Submitter Email',
		description: 'The email address of the person who submitted the proposal.',
		shortCode: 'proposal_submitter_email',
		dataType: BaseFieldDataType.STRING,
	});
	const organizationNameBaseField = await createBaseField({
		label: 'Organization Name',
		description: 'The name of the applying organization.',
		shortCode: 'organization_name',
		dataType: BaseFieldDataType.STRING,
	});
	if (proposalSubmitterEmailBaseField === undefined) {
		throw new Error("Couldn't create the proposal submitter email base field");
	}
	if (organizationNameBaseField === undefined) {
		throw new Error("Couldn't create the organization name base field");
	}
	return [proposalSubmitterEmailBaseField, organizationNameBaseField];
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

const getProposalsByExternalIds = async (
	externalIds: string[],
): Promise<Proposal[]> => {
	const proposals = await loadProposalBundle({
		offset: 0,
		limit: 100,
		search: '',
	});
	return externalIds.map((externalId) => {
		const proposal = proposals.entries.find(
			(proposalCandidate) => proposalCandidate.externalId === externalId,
		);
		if (proposal === undefined) {
			throw new Error(`There is no proposal with externalId "${externalId}"`);
		}
		return proposal;
	});
};

const getApplicationFormFieldsByBaseFieldIds = async (
	applicationFormId: number,
	baseFieldIds: number[],
): Promise<ApplicationFormField[]> => {
	const { entries: applicationFormFields } =
		await loadApplicationFormFieldBundle({ applicationFormId });
	return baseFieldIds.map((baseFieldId) => {
		const applicationFormField = applicationFormFields.find(
			(applicationFormFieldCandidate) =>
				applicationFormFieldCandidate.baseFieldId === baseFieldId,
		);
		if (applicationFormField === undefined) {
			throw new Error(
				`There is no application form field with baseFieldId "${baseFieldId}"`,
			);
		}
		return applicationFormField;
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

	it('should fail if the sourceKey is not accessible', async () => {
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
		expect(updatedBulkUpload).toMatchObject({
			status: BulkUploadStatus.FAILED,
			fileSize: null,
		});
		expect(sourceRequest.isDone()).toEqual(true);
	});

	it('should not process, and fail, if the sourceKey is not in the unprocessed namespace', async () => {
		const sourceKey = TEST_BULK_UPLOAD_SOURCE_KEY;
		const bulkUpload = await createTestBulkUpload({ sourceKey });
		const requests = await mockS3ResponsesForBulkUploadProcessing(
			bulkUpload,
			`${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
		);

		await processBulkUpload(
			{ bulkUploadId: bulkUpload.id },
			getMockJobHelpers(),
		);

		const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
		expect(updatedBulkUpload).toMatchObject({
			status: BulkUploadStatus.FAILED,
			fileSize: null,
		});
		expect(requests.getRequest.isDone()).toEqual(false);
	});

	it('should not process or modify processing status if the bulk upload is not PENDING', async () => {
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUpload = await createTestBulkUpload({
			sourceKey,
			status: BulkUploadStatus.IN_PROGRESS,
		});
		const requests = await mockS3ResponsesForBulkUploadProcessing(
			bulkUpload,
			`${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
		);

		await processBulkUpload(
			{ bulkUploadId: bulkUpload.id },
			getMockJobHelpers(),
		);

		const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
		expect(updatedBulkUpload.status).toEqual(BulkUploadStatus.IN_PROGRESS);
		expect(requests.getRequest.isDone()).toEqual(false);
	});

	it('should fail if the csv contains an invalid short code', async () => {
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
		expect(updatedBulkUpload).toMatchObject({
			status: BulkUploadStatus.FAILED,
			fileSize: 97,
		});
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

	it('should have a proper failed state if the csv is empty', async () => {
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
		expect(updatedBulkUpload).toMatchObject({
			status: BulkUploadStatus.FAILED,
			fileSize: 0,
		});
	});

	it('should update the file size for the bulk upload if the sourceKey is accessible and contains a valid CSV', async () => {
		await createTestBaseFields();
		const sourceKey = TEST_UNPROCESSED_SOURCE_KEY;
		const bulkUpload = await createTestBulkUpload({ sourceKey });
		await mockS3ResponsesForBulkUploadProcessing(
			bulkUpload,
			`${__dirname}/fixtures/processBulkUpload/validCsvTemplate.csv`,
		);
		expect(bulkUpload.fileSize).toBe(null);

		await processBulkUpload(
			{
				bulkUploadId: bulkUpload.id,
			},
			getMockJobHelpers(),
		);
		const updatedBulkUpload = await loadBulkUpload(bulkUpload.id);
		expect(updatedBulkUpload).toMatchObject({
			fileSize: 93,
		});
	});

	it('should download, process, and resolve the bulk upload if the sourceKey is accessible and contains a valid CSV bulk upload', async () => {
		const [proposalSubmitterEmailBaseField, organizationNameBaseField] =
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

		const {
			rows: [opportunity],
		} = await db.sql<Opportunity>('opportunities.selectAll');
		if (opportunity === undefined) {
			throw new Error('The opportunity was not created');
		}

		const {
			entries: [applicationForm],
		} = await loadApplicationFormBundle();
		if (applicationForm === undefined) {
			fail('The application form was not created');
		}
		expect(applicationForm).toMatchObject({
			opportunityId: opportunity.id,
			version: 1,
			createdAt: expectTimestamp,
		});

		const [firstProposal, secondProposal] = await getProposalsByExternalIds([
			'1',
			'2',
		]);
		if (firstProposal === undefined) {
			fail('The first proposal was not created');
		}
		if (secondProposal === undefined) {
			fail('The second proposal was not created');
		}
		expect(firstProposal).toMatchObject({
			externalId: '1',
			opportunityId: opportunity.id,
			createdAt: expectTimestamp,
		});
		expect(secondProposal).toMatchObject({
			externalId: '2',
			opportunityId: opportunity.id,
			createdAt: expectTimestamp,
		});

		const { rows: proposalVersions } = await db.sql<ProposalVersion>(
			'proposalVersions.selectByProposalIds',
			{ proposalIds: [firstProposal.id, secondProposal.id] },
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
			applicationFormId: applicationForm.id,
			proposalId: firstProposal.id,
			version: 1,
			createdAt: expect.any(Date) as Date,
		});
		expect(secondProposalVersion).toMatchObject({
			applicationFormId: applicationForm.id,
			proposalId: secondProposal.id,
			version: 1,
			createdAt: expect.any(Date) as Date,
		});

		const [proposalSubmitterEmailFormField, organizationNameFormField] =
			await getApplicationFormFieldsByBaseFieldIds(applicationForm.id, [
				proposalSubmitterEmailBaseField.id,
				organizationNameBaseField.id,
			]);
		if (proposalSubmitterEmailFormField === undefined) {
			fail('The proposal submitter email form field was not created');
		}
		if (organizationNameFormField === undefined) {
			fail('The organization name form field was not created');
		}

		const { rows: firstProposalFieldValues } = await db.sql<ProposalFieldValue>(
			'proposalFieldValues.selectByProposalId',
			{ proposalId: firstProposal.id },
		);
		const { rows: secondProposalFieldValues } =
			await db.sql<ProposalFieldValue>(
				'proposalFieldValues.selectByProposalId',
				{ proposalId: secondProposal.id },
			);
		expect(firstProposalFieldValues).toMatchObject([
			{
				applicationFormFieldId: proposalSubmitterEmailFormField.id,
				position: 0,
				proposalVersionId: firstProposalVersion.id,
				value: 'foo@example.com',
				createdAt: expect.any(Date) as Date,
			},
			{
				applicationFormFieldId: organizationNameFormField.id,
				position: 1,
				proposalVersionId: firstProposalVersion.id,
				value: 'Foo LLC.',
				createdAt: expect.any(Date) as Date,
			},
		]);
		expect(secondProposalFieldValues).toMatchObject([
			{
				applicationFormFieldId: proposalSubmitterEmailFormField.id,
				position: 0,
				proposalVersionId: secondProposalVersion.id,
				value: 'foo@example.com',
				createdAt: expect.any(Date) as Date,
			},
			{
				applicationFormFieldId: organizationNameFormField.id,
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
