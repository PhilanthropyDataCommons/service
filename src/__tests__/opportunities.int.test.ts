import request from 'supertest';
import { app } from '../app';
import { createOpportunity, loadTableMetrics } from '../database';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

describe('/opportunities', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/opportunities').expect(401);
		});

		it('returns an empty bundle when no data is present', async () => {
			await request(app).get('/opportunities').set(authHeader).expect(200, {
				entries: [],
				total: 0,
			});
		});

		it('returns all opportunities present in the database', async () => {
			await createOpportunity(null, {
				title: 'Tremendous opportunity 👌',
			});
			await createOpportunity(null, {
				title: 'Terrific opportunity 👐',
			});
			const response = await request(app)
				.get('/opportunities')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						id: 1,
						createdAt: expectTimestamp,
						title: 'Tremendous opportunity 👌',
					},
					{
						id: 2,
						createdAt: expectTimestamp,
						title: 'Terrific opportunity 👐',
					},
				],
				total: 2,
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await request(app).get('/opportunities/1').expect(401);
		});

		it('returns exactly one opportunity selected by id', async () => {
			await createOpportunity(null, { title: '🔥' });
			await createOpportunity(null, { title: '✨' });
			await createOpportunity(null, { title: '🚀' });

			const response = await request(app)
				.get(`/opportunities/2`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				id: 2,
				createdAt: expectTimestamp,
				title: '✨',
			});
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await request(app)
				.get('/opportunities/a')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await request(app)
				.get('/opportunities/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when id is not found', async () => {
			await createOpportunity(null, {
				title: 'This definitely should not be returned',
			});
			await request(app).get('/opportunities/9001').set(authHeader).expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/opportunities').expect(401);
		});

		it('creates and returns exactly one opportunity', async () => {
			const before = await loadTableMetrics('opportunities');
			const result = await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({ title: '🎆' })
				.expect(201);
			const after = await loadTableMetrics('opportunities');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				title: '🎆',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no title sent', async () => {
			const result = await request(app)
				.post('/opportunities')
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
