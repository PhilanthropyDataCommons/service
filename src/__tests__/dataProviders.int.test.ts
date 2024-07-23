import request from 'supertest';
import { app } from '../app';
import {
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
			const systemDataProvider = await loadSystemDataProvider();
			await createOrUpdateDataProvider({
				shortCode: 'dataRUs',
				name: 'Data R Us',
			});
			await createOrUpdateDataProvider({
				shortCode: 'nonProfitWarehouse',
				name: 'Nonprofit Warehouse',
			});

			const response = await agent
				.get('/dataProviders')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						shortCode: 'nonProfitWarehouse',
						createdAt: expectTimestamp,
						name: 'Nonprofit Warehouse',
					},
					{
						shortCode: 'dataRUs',
						createdAt: expectTimestamp,
						name: 'Data R Us',
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
			await createOrUpdateDataProvider({
				shortCode: 'dataRUs',
				name: 'Data R Us',
			});
			await createOrUpdateDataProvider({
				shortCode: 'nonProfitWarehouse',
				name: 'Nonprofit Warehouse',
			});

			const response = await agent
				.get(`/dataProviders/nonProfitWarehouse`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				shortCode: 'nonProfitWarehouse',
				createdAt: expectTimestamp,
				name: 'Nonprofit Warehouse',
			});
		});

		it('returns 404 when short code is not found', async () => {
			await createOrUpdateDataProvider({
				shortCode: 'dataRUs',
				name: 'Data R Us',
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
			expect(result.body).toMatchObject({
				shortCode: 'firework',
				name: '🎆',
				createdAt: expectTimestamp,
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
			await createOrUpdateDataProvider({
				shortCode: 'firework',
				name: 'boring text base firework',
			});
			const anotherDataProviderBefore = await createOrUpdateDataProvider({
				shortCode: 'anotherFirework',
				name: 'another boring text base firework',
			});
			const before = await loadTableMetrics('data_providers');
			const result = await agent
				.put('/dataProviders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(201);
			const anotherDataProviderAfter =
				await loadDataProvider('anotherFirework');
			const after = await loadTableMetrics('data_providers');
			expect(result.body).toMatchObject({
				shortCode: 'firework',
				name: '🎆',
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
