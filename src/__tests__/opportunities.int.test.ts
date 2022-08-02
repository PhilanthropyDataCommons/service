import request from 'supertest';
import { app } from '../app';
import { db } from '../database';
import { getLogger } from '../logger';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);

describe('/opportunities', () => {
  describe('/', () => {
    logger.debug('Now running an opportunities test');
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/opportunities')
        .expect(200, []);
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
        .expect(
          200,
          [
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
          ],
        );
    });

    it('should error if the database returns an unexpected data structure', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid result' }],
        }) as Result<object>);
      const result = await agent
        .get('/opportunities')
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'ValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });
  });

  describe('/id', () => {
    it('returns exactly one opportunity selected by id', async () => {
      const opportunityIds: Result<{ id: number; title: string }> = await db.query(`
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
      const sparkleOpportunityId = opportunityIds.rows
        .filter((it) => it.title === '✨')[0].id;
      logger.debug('sparkleOpportunityId: %d', sparkleOpportunityId);
      await agent
        .get(`/opportunities/${sparkleOpportunityId}`)
        .expect(
          200,
          {
            id: sparkleOpportunityId,
            createdAt: '2525-01-02T00:00:02.000Z',
            title: '✨',
          },
        );
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
      await agent
        .get('/opportunities/a')
        .expect(400);
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
      await agent
        .get('/opportunities/9001')
        .expect(404);
    });
  });
});
