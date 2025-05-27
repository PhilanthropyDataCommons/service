import request from 'supertest';
import { app } from '../app';
import {
	db,
	createApplicationForm,
	createApplicationFormField,
	createOrUpdateBaseField,
	createOpportunity,
	createProposal,
	createProposalVersion,
	loadSystemSource,
	loadTableMetrics,
	loadSystemFunder,
	loadSystemUser,
	createOrUpdateUserFunderPermission,
	createChangemaker,
	createOrUpdateUserChangemakerPermission,
	createChangemakerProposal,
} from '../database';
import { getLogger } from '../logger';
import {
	BaseFieldDataType,
	BaseFieldScope,
	BaseFieldSensitivityClassification,
	Permission,
} from '../types';
import { expectTimestamp, getAuthContext, loadTestUser } from '../test/utils';
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
		scope: BaseFieldScope.PROPOSAL,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
	await createOrUpdateBaseField(db, null, {
		label: 'Last Name',
		description: 'The last name of the applicant',
		shortCode: 'lastName',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
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
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
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
			const systemFunder = await loadSystemFunder(db, null);
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
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
			const systemFunder = await loadSystemFunder(db, null);
			const visibleChangemaker = await createChangemaker(db, null, {
				name: 'Visible Changemaker',
				taxId: '123456789',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				changemakerId: visibleChangemaker.id,
				permission: Permission.VIEW,
			});
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
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
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await request(app)
				.get('/proposalVersions/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
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
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const proposal = await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
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
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			const before = await loadTableMetrics('proposal_versions');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(201);
			const after = await loadTableMetrics('proposal_versions');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				proposalId: 1,
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
			const systemFunder = await loadSystemFunder(db, null);
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			const before = await loadTableMetrics('proposal_versions');
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(201);
			const after = await loadTableMetrics('proposal_versions');
			expect(result.body).toMatchObject({
				id: 1,
				proposalId: 1,
				fieldValues: [],
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('creates exactly the number of provided field values', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'firstName',
				position: 1,
				label: 'First Name',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'lastName',
				position: 2,
				label: 'Last Name',
			});
			const before = await loadTableMetrics('proposal_field_values');
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					sourceId: systemSource.id,
					fieldValues: [
						{
							applicationFormFieldId: 1,
							position: 1,
							value: 'Gronald',
							isValid: true,
							goodAsOf: '2025-04-25T12:34:03-04:00',
						},
						{
							applicationFormFieldId: 2,
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
				id: 1,
				proposalId: 1,
				fieldValues: [
					{
						id: expect.any(Number) as number,
						applicationFormFieldId: 1,
						position: 1,
						value: 'Gronald',
						isValid: true,
						goodAsOf: '2025-04-25T16:34:03+00:00',
						createdAt: expectTimestamp,
					},
					{
						id: expect.any(Number) as number,
						applicationFormFieldId: 2,
						position: 1,
						value: 'Plorp',
						isValid: true,
						goodAsOf: null,
						createdAt: expectTimestamp,
					},
				],
			});
			expect(after.count).toEqual(2);
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
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: 2,
					applicationFormId: 1,
					sourceId: systemSource.id,
					fieldValues: [],
				})
				.expect(409);

			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'Proposal',
						entityId: 2,
					},
				],
			});
		});

		it('returns 422 Unprocessable Entity when the provided source does not exist', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					sourceId: 9001,
					fieldValues: [],
				})
				.expect(422);
		});

		it('Returns 409 Conflict if the provided application form does not exist', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: 1,
					applicationFormId: 2,
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
						entityId: 2,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('Returns 409 Conflict if the provided application form ID is not associated with the proposal opportunity', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createOpportunity(db, null, {
				title: '💧',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 2,
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: 1,
					applicationFormId: 2,
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
						entityId: 2,
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
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: 1,
					sourceId: systemSource.id,
					applicationFormId: 1,
					fieldValues: [
						{
							applicationFormFieldId: 1,
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
						entityId: 1,
					},
				],
			});
			expect(after.count).toEqual(0);
		});

		it('Returns 409 Conflict if a provided application form field ID is not associated with the supplied application form ID', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createTestBaseFields();
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'firstName',
				position: 1,
				label: 'First Name',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: 'lastName',
				position: 2,
				label: 'Last Name',
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalId: 1,
					sourceId: systemSource.id,
					applicationFormId: 2,
					fieldValues: [
						{
							applicationFormFieldId: 1,
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
						entityId: 2,
						contextEntityType: 'ApplicationFormField',
						contextEntityId: 1,
					},
				],
			});
			expect(after.count).toEqual(0);
		});
	});
});
