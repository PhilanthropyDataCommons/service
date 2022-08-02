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
});
