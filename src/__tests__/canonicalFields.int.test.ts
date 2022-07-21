import request from 'supertest';
import { app } from '../app';
import { db } from '../database';
import type { Result } from 'tinypg';

const agent = request.agent(app);

describe('/canonicalFields', () => {
  describe('/', () => {
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/canonicalFields')
        .expect(200, []);
    });

    it('returns all canonical fields present in the database', async () => {
      await db.query(`
        INSERT INTO canonical_fields (
          label,
          short_code,
          data_type,
          created_at
        )
        VALUES
          ( 'First Name', 'firstName', 'string', '2022-07-20 12:00:00+0000' ),
          ( 'Last Name', 'lastName', 'string', '2022-07-20 12:00:00+0000' );
      `);
      await agent
        .get('/canonicalFields')
        .expect(
          200,
          [
            {
              createdAt: '2022-07-20T12:00:00.000Z',
              dataType: 'string',
              id: 1,
              label: 'First Name',
              shortCode: 'firstName',
            },
            {
              createdAt: '2022-07-20T12:00:00.000Z',
              dataType: 'string',
              id: 2,
              label: 'Last Name',
              shortCode: 'lastName',
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
        .get('/canonicalFields')
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'ValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });
  });
});
