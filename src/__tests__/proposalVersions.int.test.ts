import request from 'supertest';
import { app } from '../app';
import {
	db,
	createApplicationForm,
	createApplicationFormField,
	createOrUpdateBaseField,
	createProposal,
	createProposalVersion,
	loadSystemSource,
	loadTableMetrics,
	loadSystemUser,
	createChangemakerProposal,
	createProposalFieldValue,
	createPermissionGrant,
} from '../database';
import { getLogger } from '../logger';
import {
	createTestChangemaker,
	createTestFunder,
	createTestOpportunity,
} from '../test/factories';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';
import { getAuthContext, loadTestUser } from '../test/utils';
import {
	expectArray,
	expectNumber,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';

const logger = getLogger(__filename);

const createTestBaseFields = async () => {
	await createOrUpdateBaseField(db, null, {
		label: 'First Name',
		description: 'The first name of the applicant',
		shortCode: 'firstName',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
	await createOrUpdateBaseField(db, null, {
		label: 'Last Name',
		description: 'The last name of the applicant',
		shortCode: 'lastName',
		dataType: BaseFieldDataType.STRING,
		category: BaseFieldCategory.PROJECT,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
};

describe('/proposalVersions', () => {
	describe('GET /:proposalVersionId', () => {
		it('requires authentication', async () => {
			await request(app).get('/proposalVersions/1').expect(401);
		});

		it('returns exactly one proposal version selected by id', async () => {
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
			const proposalVersion = await createProposalVersion(
				db,
				testUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
				},
			);

			const response = await request(app)
				.get(`/proposalVersions/${proposalVersion.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual(proposalVersion);
		});

		it('returns the proposal version if they have access via funder', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const visibleFunder = await createTestFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [
					PermissionGrantEntityType.FUNDER,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: visibleFunder.shortCode,
			});
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const proposalVersion = await createProposalVersion(
				db,
				testUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
				},
			);

			const response = await request(app)
				.get(`/proposalVersions/${proposalVersion.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(proposalVersion);
		});

		it('returns the proposal version if they have access via changemaker', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const visibleChangemaker = await createTestChangemaker(db, null, {
				name: 'Visible Changemaker',
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: visibleChangemaker.id,
				scope: [
					PermissionGrantEntityType.CHANGEMAKER,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null);
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const proposalVersion = await createProposalVersion(
				db,
				testUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
				},
			);
			await createChangemakerProposal(db, null, {
				changemakerId: visibleChangemaker.id,
				proposalId: proposal.id,
			});
			const response = await request(app)
				.get(`/proposalVersions/${proposalVersion.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(proposalVersion);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await request(app)
				.get('/proposalVersions/a')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await request(app)
				.get('/proposalVersions/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when id is not found', async () => {
			await request(app)
				.get('/proposalVersions/900000')
				.set(authHeaderWithAdminRole)
				.expect(404);
		});

		it('returns 404 when the user has no access to the proposal version', async () => {
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
			const proposalVersion = await createProposalVersion(
				db,
				testUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
				},
			);
			await request(app)
				.get(`/proposalVersions/${proposalVersion.id}`)
				.set(authHeader)
				.expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/proposalVersions').expect(401);
		});

		it('creates exactly one proposal version for an admin user', async () => {
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
			const before = await loadTableMetrics('proposal_versions');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(201);
			const after = await loadTableMetrics('proposal_versions');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				proposalId: proposal.id,
				fieldValues: [],
			});
			expect(after.count).toEqual(1);
		});

		it('creates exactly one proposal version for a user with read and write permissions on the funder', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const testFunder = await createTestFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: testFunder.shortCode,
				scope: [
					PermissionGrantEntityType.FUNDER,
					PermissionGrantEntityType.OPPORTUNITY,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.EDIT],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: testFunder.shortCode,
			});
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const before = await loadTableMetrics('proposal_versions');
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(201);
			const after = await loadTableMetrics('proposal_versions');
			expect(result.body).toMatchObject({
				proposalId: proposal.id,
				fieldValues: [],
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 when user has edit|funder but not edit|proposal scope', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const testFunder = await createTestFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: testFunder.shortCode,
				scope: [
					PermissionGrantEntityType.FUNDER,
					PermissionGrantEntityType.OPPORTUNITY,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: testFunder.shortCode,
				scope: [
					PermissionGrantEntityType.FUNDER,
					PermissionGrantEntityType.OPPORTUNITY,
				],
				verbs: [PermissionGrantVerb.EDIT],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: testFunder.shortCode,
			});
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(422);
		});

		it('creates a proposal version for a user with edit|proposal on the opportunity', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const opportunity = await createTestOpportunity(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: opportunity.id,
				scope: [
					PermissionGrantEntityType.OPPORTUNITY,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.EDIT],
			});
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const before = await loadTableMetrics('proposal_versions');
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(201);
			const after = await loadTableMetrics('proposal_versions');
			expect(result.body).toMatchObject({
				proposalId: proposal.id,
				fieldValues: [],
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('creates exactly the number of provided field values', async () => {
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
			await createTestBaseFields();
			const firstNameField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'firstName',
				position: 1,
				label: 'First Name',
				instructions: 'Please enter the first name of the applicant.',
			});
			const lastNameField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: 'lastName',
				position: 2,
				label: 'Last Name',
				instructions: 'Please enter the last name of the applicant.',
			});
			const before = await loadTableMetrics('proposal_field_values');
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
					fieldValues: [
						{
							applicationFormFieldId: firstNameField.id,
							position: 1,
							value: 'Gronald',
							isValid: true,
							goodAsOf: '2025-04-25T12:34:03-04:00',
						},
						{
							applicationFormFieldId: lastNameField.id,
							position: 1,
							value: 'Plorp',
							isValid: true,
							goodAsOf: null,
						},
					],
				})
				.expect(201);
			const after = await loadTableMetrics('proposal_field_values');

			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				proposalId: proposal.id,
				fieldValues: [
					{
						id: expectNumber(),
						applicationFormFieldId: firstNameField.id,
						position: 1,
						value: 'Gronald',
						isValid: true,
						goodAsOf: '2025-04-25T16:34:03+00:00',
						createdAt: expectTimestamp(),
					},
					{
						id: expectNumber(),
						applicationFormFieldId: lastNameField.id,
						position: 1,
						value: 'Plorp',
						isValid: true,
						goodAsOf: null,
						createdAt: expectTimestamp(),
					},
				],
			});
			expect(after.count).toEqual(2);
		});

		it('returns 400 bad request when attempting to provide data for a forbidden field', async () => {
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
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
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

			const before = await loadTableMetrics('proposal_versions');
			await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
					fieldValues: [
						{
							applicationFormFieldId: forbiddenApplicationFormField.id,
							position: 1,
							value: 'This should not be allowed',
							goodAsOf: null,
						},
					],
				})
				.expect(400);
			const after = await loadTableMetrics('proposal_versions');
			expect(after.count).toEqual(before.count);
		});

		it('returns 400 bad request when no proposal id is provided', async () => {
			await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: 0,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(400);
		});

		it('returns 400 bad request when no source id is provided', async () => {
			await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 0,
					applicationFormId: 1,
					fieldValues: [],
				})
				.expect(400);
		});

		it('returns 400 bad request when no application id is provided', async () => {
			await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: 0,
					proposalId: 1,
					fieldValues: [],
				})
				.expect(400);
		});

		it('returns 400 bad request when no field values array is provided', async () => {
			await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: 0,
					proposalId: 1,
					applicationFormId: 1,
				})
				.expect(400);
		});

		it('returns 409 Conflict when the provided proposal does not exist', async () => {
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
			const nonExistentProposalId = proposal.id + 1000;
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: nonExistentProposalId,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(409);

			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'Proposal',
						entityId: nonExistentProposalId,
					},
				],
			});
		});

		it('returns 422 Unprocessable Entity when the provided source does not exist', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, null);
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: 9001,
					fieldValues: [],
				})
				.expect(422);
		});

		it('Returns 409 Conflict if the provided application form does not exist', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const opportunity = await createTestOpportunity(db, null);
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: proposal.id,
					applicationFormId: 9999,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(409);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'ApplicationForm',
						entityId: 9999,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('Returns 409 Conflict if the provided application form ID is not associated with the proposal opportunity', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const opportunity1 = await createTestOpportunity(db, null);
			const opportunity2 = await createTestOpportunity(db, null);
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity1.id,
			});
			await createApplicationForm(db, null, {
				opportunityId: opportunity1.id,
				name: null,
			});
			const wrongForm = await createApplicationForm(db, null, {
				opportunityId: opportunity2.id,
				name: null,
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: proposal.id,
					applicationFormId: wrongForm.id,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(409);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'ApplicationForm',
						entityId: wrongForm.id,
						contextEntityType: 'Proposal',
						contextEntityId: 1,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('Returns 409 Conflict if a provided application form field ID does not exist', async () => {
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
			const nonExistentFieldId = 99999;
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: proposal.id,
					sourceId: systemSource.id,
					applicationFormId: applicationForm.id,
					fieldValues: [
						{
							applicationFormFieldId: nonExistentFieldId,
							position: 1,
							value: 'Gronald',
							isValid: true,
							goodAsOf: null,
						},
					],
				})
				.expect(409);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'ApplicationFormField',
						entityId: nonExistentFieldId,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('Returns 409 Conflict if a provided application form field ID is not associated with the supplied application form ID', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const opportunity = await createTestOpportunity(db, null);
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm1 = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const applicationForm2 = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createTestBaseFields();
			const firstNameField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm1.id,
				baseFieldShortCode: 'firstName',
				position: 1,
				label: 'First Name',
				instructions: 'Please enter the first name of the applicant.',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: applicationForm1.id,
				baseFieldShortCode: 'lastName',
				position: 2,
				label: 'Last Name',
				instructions: 'Please enter the last name of the applicant.',
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: proposal.id,
					sourceId: systemSource.id,
					applicationFormId: applicationForm2.id,
					fieldValues: [
						{
							applicationFormFieldId: firstNameField.id,
							position: 1,
							value: 'Gronald',
							isValid: true,
							goodAsOf: null,
						},
					],
				})
				.expect(409);
			const after = await loadTableMetrics('proposal_field_values');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'ApplicationForm',
						entityId: applicationForm2.id,
						contextEntityType: 'ApplicationFormField',
						contextEntityId: firstNameField.id,
					},
				],
			});
			expect(after.count).toEqual(0);
		});
	});
});
