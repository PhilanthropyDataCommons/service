import request from 'supertest';
import { app } from '../app';
import { db } from '../database';
import type { Result } from 'tinypg';

const agent = request.agent(app);

describe('/applicationForms', () => {
  describe('GET /', () => {
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/applicationForms')
        .expect(200, []);
    });

    it('returns all application forms present in the database', async () => {
      await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' ),
          ( 'Good opportunity', '2525-02-01T00:00:05Z' );
      `);
      await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' ),
          ( 1, 2, '2022-08-20 12:00:00+0000' ),
          ( 2, 1, '2022-09-20 12:00:00+0000' )
      `);
      await agent
        .get('/applicationForms')
        .expect(
          200,
          [
            {
              createdAt: '2022-07-20T12:00:00.000Z',
              id: 1,
              opportunityId: 1,
              version: 1,
            },
            {
              createdAt: '2022-08-20T12:00:00.000Z',
              id: 2,
              opportunityId: 1,
              version: 2,
            },
            {
              createdAt: '2022-09-20T12:00:00.000Z',
              id: 3,
              opportunityId: 2,
              version: 1,
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
        .get('/applicationForms')
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'ValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });
  });
});
