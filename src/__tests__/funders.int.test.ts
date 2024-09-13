import request from 'supertest';
import { app } from '../app';
import {
	createOrUpdateFunder,
	loadFunder,
	loadTableMetrics,
} from '../database';
import { expectTimestamp } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

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
			await createOrUpdateFunder({
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
			});
			await createOrUpdateFunder({
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
			});

			const response = await agent.get('/funders').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						shortCode: 'theFoundationFoundation',
						createdAt: expectTimestamp,
						name: 'The Foundation Foundation',
					},
					{
						shortCode: 'theFundFund',
						createdAt: expectTimestamp,
						name: 'The Fund Fund',
					},
				],
				total: 2,
			});
		});
	});

	describe('GET /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.get('/funders/foo').expect(401);
		});

		it('returns exactly one funder selected by short code', async () => {
			await createOrUpdateFunder({
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
			});
			await createOrUpdateFunder({
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
			});

			const response = await agent
				.get(`/funders/theFoundationFoundation`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				shortCode: 'theFoundationFoundation',
				createdAt: expectTimestamp,
				name: 'The Foundation Foundation',
			});
		});

		it('returns 404 when short code is not found', async () => {
			await createOrUpdateFunder({
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
			});
			await agent.get('/funders/foo').set(authHeader).expect(404);
		});
	});

	describe('PUT /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.put('/funders/foo').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.put('/funders/foo').set(authHeader).expect(401);
		});

		it('creates and returns exactly one funder', async () => {
			const before = await loadTableMetrics('funders');
			const result = await agent
				.put('/funders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(201);
			const after = await loadTableMetrics('funders');
			expect(result.body).toMatchObject({
				shortCode: 'firework',
				name: '🎆',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('allows all alphanumeric, _, and - in the short name', async () => {
			await agent
				.put('/funders/Firework_-foo42')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(201);
		});

		it('updates an existing funder and no others', async () => {
			await createOrUpdateFunder({
				shortCode: 'firework',
				name: 'boring text-based firework',
			});
			const anotherFunderBefore = await createOrUpdateFunder({
				shortCode: 'anotherFirework',
				name: 'another boring text based firework',
			});
			const before = await loadTableMetrics('data_providers');
			const result = await agent
				.put('/funders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(201);
			const after = await loadTableMetrics('data_providers');
			const anotherFunderAfter = await loadFunder('anotherFirework');
			expect(result.body).toMatchObject({
				shortCode: 'firework',
				name: '🎆',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(before.count);
			expect(anotherFunderAfter).toEqual(anotherFunderBefore);
		});

		it('returns 400 bad request when no name is sent', async () => {
			const result = await agent
				.put('/funders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ noTitleHere: '👎' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when disallowed characters are included', async () => {
			const before = await loadTableMetrics('funders');
			await agent
				.put('/funders/my funder')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(400);
			const after = await loadTableMetrics('funders');
			expect(after.count).toEqual(before.count);
		});
	});
});