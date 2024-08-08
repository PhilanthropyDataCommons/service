import request from 'supertest';
import { app } from '../app';
import { createFunder, loadTableMetrics } from '../database';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

const agent = request.agent(app);

describe('/funders', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/funders').expect(401);
		});

		it('returns an empty bundle when no data is present', async () => {
			await agent.get('/funders').set(authHeader).expect(200, {
				entries: [],
				total: 0,
			});
		});

		it('returns all funders present in the database', async () => {
			await createFunder({
				name: 'The Fund Fund',
			});
			await createFunder({
				name: 'The Foundation Foundation',
			});
			const response = await agent.get('/funders').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						id: 2,
						createdAt: expectTimestamp,
						name: 'The Foundation Foundation',
					},
					{
						id: 1,
						createdAt: expectTimestamp,
						name: 'The Fund Fund',
					},
				],
				total: 2,
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await agent.get('/funders/1').expect(401);
		});

		it('returns exactly one funder selected by id', async () => {
			await createFunder({
				name: 'The Fund Fund',
			});
			await createFunder({
				name: 'The Foundation Foundation',
			});

			const response = await agent
				.get(`/funders/2`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				id: 2,
				createdAt: expectTimestamp,
				name: 'The Foundation Foundation',
			});
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent.get('/funders/a').set(authHeader).expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await agent
				.get('/funders/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when id is not found', async () => {
			await createFunder({
				name: 'The Foundation Foundation',
			});
			await agent.get('/funders/9001').set(authHeader).expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/funders').expect(401);
		});

		it('creates and returns exactly one funder', async () => {
			const before = await loadTableMetrics('funders');
			const result = await agent
				.post('/funders')
				.type('application/json')
				.set(authHeader)
				.send({ name: '🎆' })
				.expect(201);
			const after = await loadTableMetrics('funders');
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
				.post('/funders')
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
