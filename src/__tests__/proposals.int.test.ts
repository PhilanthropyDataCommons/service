import request from 'supertest';
import { TinyPgError } from 'tinypg';
import { app } from '../app';
import { db } from '../database';
import { getLogger } from '../logger';
import { PostgresErrorCode } from '../types/PostgresErrorCode';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);

describe('/proposals', () => {
  describe('GET /', () => {
    logger.debug('Now running an proposals test');
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/proposals')
        .expect(200, []);
    });

    it('returns all proposals present in the database', async () => {
      await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( '🔥', '2525-01-02T00:00:01Z' )
      `);
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
      await db.query(`
        INSERT INTO proposals (
          applicant_id,
          external_id,
          opportunity_id,
          created_at
        )
        VALUES
          ( 1, 'proposal-1', 1, '2525-01-01T00:00:05Z' ),
          ( 1, 'proposal-2', 1, '2525-01-01T00:00:06Z' );
      `);
      await agent
        .get('/proposals')
        .expect(
          200,
          [
            {
              id: 1,
              externalId: 'proposal-1',
              applicantId: 1,
              opportunityId: 1,
              createdAt: '2525-01-01T00:00:05.000Z',
            },
            {
              id: 2,
              externalId: 'proposal-2',
              applicantId: 1,
              opportunityId: 1,
              createdAt: '2525-01-01T00:00:06.000Z',
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
        .get('/proposals')
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'InternalValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 UnknownError if a generic Error is thrown when selecting', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => {
          throw new Error('This is unexpected');
        });
      const result = await agent
        .get('/proposals')
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'UnknownError',
        errors: expect.any(Array) as unknown[],
      });
    });

    it('returns 503 DatabaseError if an insufficient resources database error is thrown when selecting', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => {
          throw new TinyPgError(
            'Something went wrong',
            undefined,
            {
              error: {
                code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
              },
            },
          );
        });
      const result = await agent
        .get('/proposals')
        .expect(503);
      expect(result.body).toMatchObject({
        name: 'DatabaseError',
        errors: [{
          code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
        }],
      });
    });
  });
});
