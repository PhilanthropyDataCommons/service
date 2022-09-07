import request from 'supertest';
import { app } from '../app';
import { db } from '../database';
import type { Result } from 'tinypg';

const agent = request.agent(app);

describe('/applicants', () => {
  describe('GET /', () => {
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/applicants')
        .expect(200, []);
    });

    it('returns all applicants present in the database', async () => {
      await db.query(`
        INSERT INTO applicants (
          external_id,
          opted_in,
          created_at
        )
        VALUES
          ( '12345', 'true', '2022-07-20 12:00:00+0000' ),
          ( '67890', 'false', '2022-07-20 12:00:00+0000' );
      `);
      await agent
        .get('/applicants')
        .expect(
          200,
          [
            {
              createdAt: '2022-07-20T12:00:00.000Z',
              externalId: '12345',
              id: 1,
              optedIn: true,
            },
            {
              createdAt: '2022-07-20T12:00:00.000Z',
              externalId: '67890',
              id: 2,
              optedIn: false,
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
        .get('/applicants')
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'ValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });
  });
});
