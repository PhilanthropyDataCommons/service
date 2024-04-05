import request from 'supertest';
import { app } from '../app';
import { db, loadTableMetrics } from '../database';
import { getLogger } from '../logger';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);

describe('/opportunities', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/opportunities').expect(401);
		});

		it('returns an empty array when no data is present', async () => {
			await agent.get('/opportunities').set(authHeader).expect(200, []);
		});

		it('returns all opportunities present in the database', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' ),
          ( 'Terrific opportunity 👐', '2525-01-01T00:00:06Z' );
      `);
			await agent
				.get('/opportunities')
				.set(authHeader)
				.expect(200, [
					{
						id: 1,
						createdAt: '2525-01-01T00:00:05.000Z',
						title: 'Tremendous opportunity 👌',
					},
					{
						id: 2,
						createdAt: '2525-01-01T00:00:06.000Z',
						title: 'Terrific opportunity 👐',
					},
				]);
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await agent.get('/opportunities/1').expect(401);
		});

		it('returns exactly one opportunity selected by id', async () => {
			const opportunityIds: Result<{ id: number; title: string }> =
				await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' ),
          ( '✨', '2525-01-02T00:00:02Z' ),
          ( '🚀', '2525-01-02T00:00:03Z' )
        RETURNING id, title;
      `);
			logger.debug('opportunityIds: %o', opportunityIds);
			const sparkleOpportunity = opportunityIds.rows.filter(
				(it) => it.title === '✨',
			)[0];
			if (sparkleOpportunity === undefined) {
				throw new Error(
					'The sparkle opportunity could not be created so the test must fail.',
				);
			}
			logger.debug('sparkleOpportunityId: %d', sparkleOpportunity.id);
			await agent
				.get(`/opportunities/${sparkleOpportunity.id}`)
				.set(authHeader)
				.expect(200, {
					id: sparkleOpportunity.id,
					createdAt: '2525-01-02T00:00:02.000Z',
					title: '✨',
				});
		});

		it('returns 400 bad request when id is a letter', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'This should not be returned', '2525-01-02T00:00:04Z' ),
          ( 'This also should not be returned', '2525-01-02T00:00:05Z' );
      `);
			const result = await agent
				.get('/opportunities/a')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 404 when id is not found', async () => {
			await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'This definitely should not be returned', '2525-01-02T00:00:06Z' ),
          ( 'This surely also should not be returned', '2525-01-02T00:00:07Z' );
      `);
			await agent.get('/opportunities/9001').set(authHeader).expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/opportunities').expect(401);
		});

		it('creates exactly one opportunity', async () => {
			const before = await loadTableMetrics('opportunities');
			logger.debug('before: %o', before);
			const result = await agent
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({ title: '🎆' })
				.expect(201);
			const after = await loadTableMetrics('opportunities');
			logger.debug('after: %o', after);
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				title: '🎆',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no title sent', async () => {
			const result = await agent
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
