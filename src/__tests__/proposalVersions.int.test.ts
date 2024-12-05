import request from 'supertest';
import { app } from '../app';
import {
	createApplicationForm,
	createApplicationFormField,
	createBaseField,
	createOpportunity,
	createProposal,
	createProposalVersion,
	loadSystemSource,
	loadTableMetrics,
} from '../database';
import { getLogger } from '../logger';
import { BaseFieldDataType, BaseFieldScope } from '../types';
import { expectTimestamp, loadTestUser } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

const logger = getLogger(__filename);

const createTestBaseFields = async () => {
	await createBaseField({
		label: 'First Name',
		description: 'The first name of the applicant',
		shortCode: 'firstName',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});
	await createBaseField({
		label: 'Last Name',
		description: 'The last name of the applicant',
		shortCode: 'lastName',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});
};

describe('/proposalVersions', () => {
	describe('GET /:proposalVersionId', () => {
		it('requires authentication', async () => {
			await request(app).get('/proposalVersions/1').expect(401);
		});

		it('returns exactly one proposal version selected by id', async () => {
			const systemSource = await loadSystemSource();
			const opportunity = await createOpportunity({ title: '🔥' });
			const testUser = await loadTestUser();
			const proposal = await createProposal({
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
				createdBy: testUser.keycloakUserId,
			});
			const applicationForm = await createApplicationForm({
				opportunityId: opportunity.id,
			});
			const proposalVersion = await createProposalVersion({
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
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
				.set(authHeader)
				.expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/proposalVersions').expect(401);
		});

		it('creates exactly one proposal version', async () => {
			const systemSource = await loadSystemSource();
			await createOpportunity({ title: '🔥' });
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			const before = await loadTableMetrics('proposal_versions');
			logger.debug('before: %o', before);
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
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				proposalId: 1,
				fieldValues: [],
			});
			expect(after.count).toEqual(1);
		});

		it('creates exactly the number of provided field values', async () => {
			const systemSource = await loadSystemSource();
			await createOpportunity({ title: '🔥' });
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			await createTestBaseFields();
			await createApplicationFormField({
				applicationFormId: 1,
				baseFieldId: 1,
				position: 1,
				label: 'First Name',
			});
			await createApplicationFormField({
				applicationFormId: 1,
				baseFieldId: 2,
				position: 2,
				label: 'Last Name',
			});
			const before = await loadTableMetrics('proposal_field_values');
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
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
						},
						{
							applicationFormFieldId: 2,
							position: 1,
							value: 'Plorp',
							isValid: true,
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
						createdAt: expectTimestamp,
					},
					{
						id: expect.any(Number) as number,
						applicationFormFieldId: 2,
						position: 1,
						value: 'Plorp',
						isValid: true,
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
			const systemSource = await loadSystemSource();
			await createOpportunity({ title: '🔥' });
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
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

		it('returns 409 conflict when the provided source does not exist', async () => {
			await createOpportunity({ title: '🔥' });
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
					applicationFormId: 1,
					sourceId: 9001,
					fieldValues: [],
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'InputConflictError',
				details: [
					{
						entityType: 'Source',
						entityId: 9001,
					},
				],
			});
		});

		it('Returns 409 Conflict if the provided application form does not exist', async () => {
			const systemSource = await loadSystemSource();
			await createOpportunity({ title: '🔥' });
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
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
			const systemSource = await loadSystemSource();
			await createOpportunity({ title: '🔥' });
			await createOpportunity({ title: '💧' });
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			await createApplicationForm({
				opportunityId: 2,
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
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
			const systemSource = await loadSystemSource();
			await createOpportunity({ title: '🔥' });
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
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
			const systemSource = await loadSystemSource();
			await createOpportunity({ title: '🔥' });
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			await createApplicationForm({
				opportunityId: 1,
			});
			await createTestBaseFields();
			await createApplicationFormField({
				applicationFormId: 1,
				baseFieldId: 1,
				position: 1,
				label: 'First Name',
			});
			await createApplicationFormField({
				applicationFormId: 1,
				baseFieldId: 2,
				position: 2,
				label: 'Last Name',
			});
			const before = await loadTableMetrics('proposal_field_values');
			logger.debug('before: %o', before);
			const result = await request(app)
				.post('/proposalVersions')
				.type('application/json')
				.set(authHeader)
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
