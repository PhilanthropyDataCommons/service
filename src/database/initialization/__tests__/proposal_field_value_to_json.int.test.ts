import {
	createApplicationForm,
	createApplicationFormField,
	createFile,
	createOrUpdateBaseField,
	createOrUpdateUser,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	db,
	loadSystemSource,
} from '../..';
import { createTestOpportunity } from '../../../test/factories';
import { getAuthContext, loadTestUser } from '../../../test/utils';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
} from '../../../types';
import type { ProposalFieldValue, JsonResultSet } from '../../../types';

describe('/proposal_field_value_to_json', () => {
	it('returns a db error if attempting to load a forbidden proposal_field_value_to_json', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const systemSource = await loadSystemSource(db, null);
		const opportunity = await createTestOpportunity(db, null);
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-1',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
			name: null,
		});
		const forbiddenBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Forbidden Field',
			description: 'This field should not be used in proposal versions',
			shortCode: 'forbiddenField',
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		});
		const forbiddenApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: forbiddenBaseField.shortCode,
				position: 1,
				label: 'Forbidden Field',
				instructions: 'This field should not be used in proposal versions',
				inputType: null,
			},
		);
		const proposalVersion = await createProposalVersion(
			db,
			testUserAuthContext,
			{
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
			},
		);
		await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: forbiddenApplicationFormField.id,
			position: 1,
			value: 'Should not be returned',
			isValid: true,
			goodAsOf: null,
		});
		await createOrUpdateBaseField(db, null, {
			...forbiddenBaseField,
			sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
		});

		await expect(
			db.query(
				'SELECT proposal_field_value_to_json(proposal_field_values.*) FROM proposal_field_values WHERE proposal_field_values.id = 1',
			),
		).rejects.toThrow(
			'Attempt to convert forbidden proposal_field_value to JSON (1)',
		);
	});

	it('returns a File object for file field values when creators match', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const systemSource = await loadSystemSource(db, null);
		const opportunity = await createTestOpportunity(db, null);
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-with-file',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
			name: null,
		});

		const fileBaseField = await createOrUpdateBaseField(db, null, {
			label: 'File Upload',
			description: 'A field for file uploads',
			shortCode: 'fileUpload',
			dataType: BaseFieldDataType.FILE,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
		});

		const fileApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: fileBaseField.shortCode,
				position: 1,
				label: 'Upload a document',
				instructions: 'Please upload your document',
				inputType: null,
			},
		);

		const proposalVersion = await createProposalVersion(
			db,
			testUserAuthContext,
			{
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
			},
		);

		// Create a file with the same creator as the proposal version
		const file = await createFile(db, testUserAuthContext, {
			name: 'test-document.pdf',
			mimeType: 'application/pdf',
			size: 1024,
			s3BucketName: process.env.S3_BUCKET ?? '',
		});

		// Create a proposal field value referencing the file
		const proposalFieldValue = await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: fileApplicationFormField.id,
			position: 1,
			value: file.id.toString(),
			isValid: true,
			goodAsOf: null,
		});

		const result = await db.query<JsonResultSet<ProposalFieldValue>>(
			`SELECT proposal_field_value_to_json(proposal_field_values.*) as object FROM proposal_field_values WHERE proposal_field_values.id = ${proposalFieldValue.id}`,
		);

		const {
			rows: [row],
		} = result;
		expect(row).toMatchObject({
			object: {
				value: file.id.toString(),
				file,
			},
		});
	});

	it('returns a string for file field values when creators do not match', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		// Create a different user for the file
		const otherUser = await createOrUpdateUser(db, null, {
			keycloakUserId: '22222222-2222-2222-2222-222222222222',
			keycloakUserName: 'OtherUser',
		});
		const otherUserAuthContext = getAuthContext(otherUser);
		const systemSource = await loadSystemSource(db, null);
		const opportunity = await createTestOpportunity(db, null);
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-with-other-file',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
			name: null,
		});

		// Create a file base field
		const fileBaseField = await createOrUpdateBaseField(db, null, {
			label: 'File Upload',
			description: 'A field for file uploads',
			shortCode: 'fileUpload2',
			dataType: BaseFieldDataType.FILE,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
		});

		const fileApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: fileBaseField.shortCode,
				position: 1,
				label: 'Upload a document',
				instructions: 'Please upload your document',
				inputType: null,
			},
		);

		const proposalVersion = await createProposalVersion(
			db,
			testUserAuthContext,
			{
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
			},
		);

		// Create a file with a DIFFERENT creator than the proposal version
		const file = await createFile(db, otherUserAuthContext, {
			name: 'other-user-document.pdf',
			mimeType: 'application/pdf',
			size: 2048,
			s3BucketName: process.env.S3_BUCKET ?? '',
		});

		// Create a proposal field value referencing the file
		const proposalFieldValue = await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: fileApplicationFormField.id,
			position: 1,
			value: file.id.toString(),
			isValid: true,
			goodAsOf: null,
		});

		const result = await db.query<JsonResultSet<ProposalFieldValue>>(
			`SELECT proposal_field_value_to_json(proposal_field_values.*) as object FROM proposal_field_values WHERE proposal_field_values.id = ${proposalFieldValue.id}`,
		);

		const {
			rows: [row],
		} = result;
		expect(row).toMatchObject({
			object: {
				value: file.id.toString(),
				file: null,
			},
		});
	});

	it('returns a string for file field values when file does not exist', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const systemSource = await loadSystemSource(db, null);
		const opportunity = await createTestOpportunity(db, null);
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-with-missing-file',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
			name: null,
		});

		// Create a file base field
		const fileBaseField = await createOrUpdateBaseField(db, null, {
			label: 'File Upload',
			description: 'A field for file uploads',
			shortCode: 'fileUpload3',
			dataType: BaseFieldDataType.FILE,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
		});

		const fileApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: fileBaseField.shortCode,
				position: 1,
				label: 'Upload a document',
				instructions: 'Please upload your document',
				inputType: null,
			},
		);

		const proposalVersion = await createProposalVersion(
			db,
			testUserAuthContext,
			{
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
			},
		);

		// Create a proposal field value referencing a non-existent file ID
		const proposalFieldValue = await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: fileApplicationFormField.id,
			position: 1,
			value: '99999',
			isValid: true,
			goodAsOf: null,
		});

		const result = await db.query<JsonResultSet<ProposalFieldValue>>(
			`SELECT proposal_field_value_to_json(proposal_field_values.*) as object FROM proposal_field_values WHERE proposal_field_values.id = ${proposalFieldValue.id}`,
		);

		const {
			rows: [row],
		} = result;
		expect(row).toMatchObject({
			object: {
				value: '99999',
				file: null,
			},
		});
	});

	it('returns a string for file field values with non-integer values', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const systemSource = await loadSystemSource(db, null);
		const opportunity = await createTestOpportunity(db, null);
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-with-invalid-file-id',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
			name: null,
		});

		// Create a file base field
		const fileBaseField = await createOrUpdateBaseField(db, null, {
			label: 'File Upload',
			description: 'A field for file uploads',
			shortCode: 'fileUpload4',
			dataType: BaseFieldDataType.FILE,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
		});

		const fileApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: fileBaseField.shortCode,
				position: 1,
				label: 'Upload a document',
				instructions: 'Please upload your document',
				inputType: null,
			},
		);

		const proposalVersion = await createProposalVersion(
			db,
			testUserAuthContext,
			{
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
			},
		);

		// Create a proposal field value with a non-integer string value
		const proposalFieldValue = await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: fileApplicationFormField.id,
			position: 1,
			value: 'not-a-number',
			isValid: true,
			goodAsOf: null,
		});

		const result = await db.query<JsonResultSet<ProposalFieldValue>>(
			`SELECT proposal_field_value_to_json(proposal_field_values.*) as object FROM proposal_field_values WHERE proposal_field_values.id = ${proposalFieldValue.id}`,
		);

		const {
			rows: [row],
		} = result;
		expect(row).toMatchObject({
			object: {
				value: 'not-a-number',
				file: null,
			},
		});
	});

	it('returns a string for non-file field values', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const systemSource = await loadSystemSource(db, null);
		const opportunity = await createTestOpportunity(db, null);
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-with-string',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
			name: null,
		});

		// Create a string base field
		const stringBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Text Field',
			description: 'A regular text field',
			shortCode: 'textField',
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.PUBLIC,
		});

		const stringApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: stringBaseField.shortCode,
				position: 1,
				label: 'Enter text',
				instructions: 'Please enter some text',
				inputType: null,
			},
		);

		const proposalVersion = await createProposalVersion(
			db,
			testUserAuthContext,
			{
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
			},
		);

		const proposalFieldValue = await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: stringApplicationFormField.id,
			position: 1,
			value: 'This is a regular string value',
			isValid: true,
			goodAsOf: null,
		});

		const result = await db.query<JsonResultSet<ProposalFieldValue>>(
			`SELECT proposal_field_value_to_json(proposal_field_values.*) as object FROM proposal_field_values WHERE proposal_field_values.id = ${proposalFieldValue.id}`,
		);

		const {
			rows: [row],
		} = result;
		expect(row).toMatchObject({
			object: {
				value: 'This is a regular string value',
				file: null,
			},
		});
	});
});
