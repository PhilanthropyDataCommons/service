import request from 'supertest';
import { app } from '../app';
import {
	db,
	createChangemaker,
	createOrUpdateDataProvider,
	createOrUpdateFunder,
	createSource,
	loadSystemSource,
	loadTableMetrics,
	createOpportunity,
	createProposal,
	createProposalVersion,
	createApplicationForm,
	loadSource,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import { NotFoundError } from '../errors';

const agent = request.agent(app);

describe('/sources', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/sources').expect(401);
		});

		it('returns the system source when no data has been added', async () => {
			const systemSource = await loadSystemSource(db, null);
			await agent
				.get('/sources')
				.set(authHeader)
				.expect(200, {
					entries: [systemSource],
					total: 1,
				});
		});

		it('returns all sources present in the database', async () => {
			const systemSource = await loadSystemSource(db, null);
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const source = await createSource(db, null, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});
			const response = await agent.get('/sources').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [source, systemSource],
				total: 2,
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await agent.get('/sources/1').expect(401);
		});

		it('returns exactly one source selected by id', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const source = await createSource(db, null, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});

			const response = await agent
				.get(`/sources/${source.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(source);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent.get('/sources/a').set(authHeader).expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await agent
				.get('/sources/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when id is not found', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createSource(db, null, {
				label: 'not to be returned',
				changemakerId: changemaker.id,
			});
			await agent.get('/sources/9001').set(authHeader).expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/sources').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.post('/sources').set(authHeader).expect(401);
		});

		it('creates and returns exactly one changemaker source', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					changemakerId: changemaker.id,
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				changemakerId: changemaker.id,
				changemaker,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('creates and returns exactly one funder source', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'foo',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					funderShortCode: 'foo',
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				funderShortCode: 'foo',
				funder,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('creates and returns exactly one data provider source', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'foo',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const before = await loadTableMetrics('sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					dataProviderShortCode: 'foo',
				})
				.expect(201);
			const after = await loadTableMetrics('sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				dataProviderShortCode: 'foo',
				dataProvider,
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(2);
		});

		it('returns 400 bad request when no label sent', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					changemakerId: changemaker.id,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no related entity is sent', async () => {
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
	describe('DELETE /:sourceId', () => {
		it('requires authentication', async () => {
			await agent.delete('/sources/:sourceId').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.delete('/sources/:sourceId').expect(401);
		});

		it('deletes exactly one source that has no proposals associated with it', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const localSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: 'Example Inc.',
			});
			const before = await loadTableMetrics('sources');

			await agent
				.delete(`/sources/${localSource.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.expect(200);

			const after = await loadTableMetrics('sources');

			expect(before.count).toEqual(2);
			expect(after.count).toEqual(1);
		});

		it('throws an error when it tries to delete a source that is associated with a proposal', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const localSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: 'Example Inc.',
			});
			await createOpportunity(db, null, { title: '🔥' });
			const testUser = await loadTestUser();
			const proposal = await createProposal(db, null, {
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createProposalVersion(db, null, {
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: localSource.id,
				createdBy: testUser.keycloakUserId,
			});
			const before = await loadTableMetrics('sources');

			await agent
				.delete(`/sources/${localSource.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.expect(200);

			const after = await loadTableMetrics('sources');

			expect(before.count).toEqual(2);
			expect(after.count).toEqual(2);
		});
	});
});
