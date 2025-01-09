import request from 'supertest';
import { app } from '../app';
import {
	createChangemaker,
	createOrUpdateDataProvider,
	createOrUpdateFunder,
	createSource,
	loadSystemSource,
	loadTableMetrics,
} from '../database';
import { expectTimestamp } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

const agent = request.agent(app);

describe('/sources', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/sources').expect(401);
		});

		it('returns the system source when no data has been added', async () => {
			const systemSource = await loadSystemSource(null);
			await agent
				.get('/sources')
				.set(authHeader)
				.expect(200, {
					entries: [systemSource],
					total: 1,
				});
		});

		it('returns all sources present in the database', async () => {
			const systemSource = await loadSystemSource(null);
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const source = await createSource({
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
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const source = await createSource({
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
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createSource({
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
			const changemaker = await createChangemaker({
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
			const funder = await createOrUpdateFunder({
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
			const dataProvider = await createOrUpdateDataProvider({
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
			const changemaker = await createChangemaker({
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
});
