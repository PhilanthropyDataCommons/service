import request from 'supertest';
import { app } from '../app';
import { createDataProvider, loadTableMetrics } from '../database';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

const agent = request.agent(app);

describe('/dataProviders', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/dataProviders').expect(401);
		});

		it('returns an empty bundle when no data is present', async () => {
			await agent.get('/dataProviders').set(authHeader).expect(200, {
				entries: [],
				total: 0,
			});
		});

		it('returns all data providers present in the database', async () => {
			await createDataProvider({
				name: 'Data R Us',
			});
			await createDataProvider({
				name: 'Nonprofit Warehouse',
			});
			const response = await agent
				.get('/dataProviders')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						id: 2,
						createdAt: expectTimestamp,
						name: 'Nonprofit Warehouse',
					},
					{
						id: 1,
						createdAt: expectTimestamp,
						name: 'Data R Us',
					},
				],
				total: 2,
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await agent.get('/dataProviders/1').expect(401);
		});

		it('returns exactly one data provider selected by id', async () => {
			await createDataProvider({
				name: 'Data R Us',
			});
			await createDataProvider({
				name: 'Nonprofit Warehouse',
			});

			const response = await agent
				.get(`/dataProviders/2`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				id: 2,
				createdAt: expectTimestamp,
				name: 'Nonprofit Warehouse',
			});
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent
				.get('/dataProviders/a')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await agent
				.get('/dataProviders/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when id is not found', async () => {
			await createDataProvider({
				name: 'Data R Us',
			});
			await agent.get('/dataProviders/9001').set(authHeader).expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/dataProviders').expect(401);
		});

		it('creates and returns exactly one data provider', async () => {
			const before = await loadTableMetrics('data_providers');
			const result = await agent
				.post('/dataProviders')
				.type('application/json')
				.set(authHeader)
				.send({ name: '🎆' })
				.expect(201);
			const after = await loadTableMetrics('data_providers');
			expect(result.body).toMatchObject({
				id: 1,
				name: '🎆',
				createdAt: expectTimestamp,
			});
			expect(before.count).toEqual(0);
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no name is sent', async () => {
			const result = await agent
				.post('/dataProviders')
				.type('application/json')
				.set(authHeader)
				.send({ noTitleHere: '👎' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
});
