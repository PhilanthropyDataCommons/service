import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOrUpdateDataProvider,
	loadDataProvider,
	loadSystemDataProvider,
	loadTableMetrics,
} from '../database';
import { expectTimestamp } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

const agent = request.agent(app);

describe('/dataProviders', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/dataProviders').expect(401);
		});

		it('returns all data providers present in the database', async () => {
			const systemDataProvider = await loadSystemDataProvider(db, null);
			await createOrUpdateDataProvider(db, null, {
				shortCode: 'dataRUs',
				name: 'Data R Us',
				keycloakOrganizationId: null,
			});
			await createOrUpdateDataProvider(db, null, {
				shortCode: 'nonProfitWarehouse',
				name: 'Nonprofit Warehouse',
				keycloakOrganizationId: null,
			});

			const response = await agent
				.get('/dataProviders')
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				entries: [
					{
						shortCode: 'nonProfitWarehouse',
						createdAt: expectTimestamp,
						name: 'Nonprofit Warehouse',
						keycloakOrganizationId: null,
					},
					{
						shortCode: 'dataRUs',
						createdAt: expectTimestamp,
						name: 'Data R Us',
						keycloakOrganizationId: null,
					},
					systemDataProvider,
				],
				total: 3,
			});
		});
	});

	describe('GET /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.get('/dataProviders/foo').expect(401);
		});

		it('returns exactly one data provider selected by short code', async () => {
			await createOrUpdateDataProvider(db, null, {
				shortCode: 'dataRUs',
				name: 'Data R Us',
				keycloakOrganizationId: null,
			});
			await createOrUpdateDataProvider(db, null, {
				shortCode: 'nonProfitWarehouse',
				name: 'Nonprofit Warehouse',
				keycloakOrganizationId: null,
			});

			const response = await agent
				.get(`/dataProviders/nonProfitWarehouse`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				shortCode: 'nonProfitWarehouse',
				createdAt: expectTimestamp,
				name: 'Nonprofit Warehouse',
				keycloakOrganizationId: null,
			});
		});

		it('returns 404 when short code is not found', async () => {
			await createOrUpdateDataProvider(db, null, {
				shortCode: 'dataRUs',
				name: 'Data R Us',
				keycloakOrganizationId: null,
			});
			await agent.get('/dataProviders/foo').set(authHeader).expect(404);
		});
	});

	describe('PUT /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.put('/dataProviders/foo').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.put('/dataProviders/foo').set(authHeader).expect(401);
		});

		it('creates and returns exactly one data provider', async () => {
			const before = await loadTableMetrics('data_providers');
			const result = await agent
				.put('/dataProviders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(201);
			const after = await loadTableMetrics('data_providers');
			expect(result.body).toStrictEqual({
				shortCode: 'firework',
				name: '🎆',
				createdAt: expectTimestamp,
				keycloakOrganizationId: null,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('allows all alphanumeric, _, and - in the short name', async () => {
			await agent
				.put('/dataProviders/Firework_-foo42')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(201);
		});

		it('updates an existing data provider and no others', async () => {
			await createOrUpdateDataProvider(db, null, {
				shortCode: 'firework',
				name: 'boring text base firework',
				keycloakOrganizationId: null,
			});
			const anotherDataProviderBefore = await createOrUpdateDataProvider(
				db,
				null,
				{
					shortCode: 'anotherFirework',
					name: 'another boring text base firework',
					keycloakOrganizationId: null,
				},
			);
			const before = await loadTableMetrics('data_providers');
			const result = await agent
				.put('/dataProviders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					name: '🎆',
					keycloakOrganizationId: '8b0163ac-bd91-11ef-8579-9fa8ab9f4b7d',
				})
				.expect(201);
			const anotherDataProviderAfter = await loadDataProvider(
				db,
				null,
				'anotherFirework',
			);
			const after = await loadTableMetrics('data_providers');
			expect(result.body).toStrictEqual({
				shortCode: 'firework',
				name: '🎆',
				keycloakOrganizationId: '8b0163ac-bd91-11ef-8579-9fa8ab9f4b7d',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(before.count);
			expect(anotherDataProviderAfter).toEqual(anotherDataProviderBefore);
		});

		it('returns 400 bad request when no name is sent', async () => {
			const result = await agent
				.put('/dataProviders/foo')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ noTitleHere: '👎' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when disallowed characters are included in the short code', async () => {
			const before = await loadTableMetrics('data_providers');
			await agent
				.put('/dataProviders/my provider')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(400);
			const after = await loadTableMetrics('data_providers');
			expect(after.count).toEqual(before.count);
		});
	});
});
