import request from 'supertest';
import { app } from '../app';
import { db, loadTableMetrics } from '../database';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

const agent = request.agent(app);

describe('/platformProviderResponses', () => {
	describe('GET /', () => {
		it('returns no platform provider responses if none exist', async () => {
			const result = await agent
				.get('/platformProviderResponses?externalId=000000000')
				.set(authHeader)
				.expect(200);
			expect(result.body).toMatchObject([]);
		});

		it('returns the desired platform provider responses', async () => {
			await db.sql('platformProviderResponses.insertOne', {
				externalId: '000000000',
				platformProvider: 'example',
				data: JSON.stringify({ helloWorld: 42 }),
			});
			await db.sql('platformProviderResponses.insertOne', {
				externalId: '000000000',
				platformProvider: 'anotherExample',
				data: JSON.stringify({ goodbyeGalaxy: '17' }),
			});
			const result = await agent
				.get('/platformProviderResponses?externalId=000000000')
				.set(authHeader)
				.expect(200);
			expect(result.body).toMatchObject([
				{
					externalId: '000000000',
					platformProvider: 'anotherExample',
					data: {
						goodbyeGalaxy: '17',
					},
					createdAt: expectTimestamp,
				},
				{
					externalId: '000000000',
					platformProvider: 'example',
					data: {
						helloWorld: 42,
					},
					createdAt: expectTimestamp,
				},
			]);
		});

		it('returns a 400 error if no external ID is provided', async () => {
			const result = await agent
				.get('/platformProviderResponses')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});

	describe('POST /', () => {
		it('creates exactly one platform provider response', async () => {
			const before = await loadTableMetrics('platform_provider_responses');
			const result = await agent
				.post('/platformProviderResponses')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: '000000000',
					platformProvider: 'example',
					data: {
						helloWorld: 42,
					},
				})
				.expect(201);
			const after = await loadTableMetrics('platform_provider_responses');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				externalId: '000000000',
				platformProvider: 'example',
				data: {
					helloWorld: 42,
				},
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('updates values when data is submitted against an existing primary key', async () => {
			await db.sql('platformProviderResponses.insertOne', {
				externalId: '000000000',
				platformProvider: 'example',
				data: JSON.stringify({ helloWorld: 42 }),
			});
			const before = await loadTableMetrics('platform_provider_responses');
			const result = await agent
				.post('/platformProviderResponses')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: '000000000',
					platformProvider: 'example',
					data: {
						helloWorld: 52,
					},
				})
				.expect(201);
			const after = await loadTableMetrics('platform_provider_responses');
			expect(before.count).toEqual(1);
			expect(after.count).toEqual(1);
			expect(result.body).toMatchObject({
				externalId: '000000000',
				platformProvider: 'example',
				data: {
					helloWorld: 52,
				},
				createdAt: expectTimestamp,
			});
		});

		it('returns a 400 error if no external ID is provided', async () => {
			const before = await loadTableMetrics('platform_provider_responses');
			const result = await agent
				.post('/platformProviderResponses')
				.type('application/json')
				.set(authHeader)
				.send({
					platformProvider: 'example',
					data: {
						helloWorld: 42,
					},
				})
				.expect(400);
			const after = await loadTableMetrics('platform_provider_responses');
			expect(before.count).toEqual(0);
			expect(after.count).toEqual(0);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});
	});
});
