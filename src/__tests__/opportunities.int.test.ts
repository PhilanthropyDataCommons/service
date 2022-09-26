import request from 'supertest';
import { TinyPgError } from 'tinypg';
import { app } from '../app';
import { db } from '../database';
import { getLogger } from '../logger';
import {
  getTableMetrics,
  isoTimestampPattern,
} from '../test/utils';
import { PostgresErrorCode } from '../types/PostgresErrorCode';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);

describe('/opportunities', () => {
  describe('GET /', () => {
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
        .get('/opportunities')
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
        .get('/opportunities')
        .expect(503);
      expect(result.body).toMatchObject({
        name: 'DatabaseError',
        errors: [{
          code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
        }],
      });
    });
  });

  describe('GET /id', () => {
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
      const result = await agent
        .get('/opportunities/a')
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        errors: expect.any(Array) as unknown[],
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
      await agent
        .get('/opportunities/9001')
        .expect(404);
    });

    it('returns a 500 InternalValidationError if the database returns an unexpected data structure', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid result' }],
        }) as Result<object>);
      const result = await agent
        .get('/opportunities/1')
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
        .get('/opportunities/1')
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
        .get('/opportunities/1')
        .expect(503);
      expect(result.body).toMatchObject({
        name: 'DatabaseError',
        errors: [{
          code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
        }],
      });
    });
  });

  describe('POST /', () => {
    it('creates exactly one opportunity', async () => {
      const before = await getTableMetrics('opportunities');
      logger.debug('before: %o', before);
      const result = await agent
        .post('/opportunities')
        .type('application/json')
        .send({ title: '🎆' })
        .expect(201);
      const after = await getTableMetrics('opportunities');
      logger.debug('after: %o', after);
      expect(before.count).toEqual('0');
      expect(result.body).toMatchObject({
        id: 1,
        title: '🎆',
        createdAt: expect.stringMatching(isoTimestampPattern) as string,
      });
      expect(after.count).toEqual('1');
    });

    it('returns 400 bad request when no title sent', async () => {
      const result = await agent
        .post('/opportunities')
        .type('application/json')
        .send({ noTitleHere: '👎' })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 if the database returns an unexpected data structure', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid result' }],
        }) as Result<object>);
      const result = await agent
        .post('/opportunities')
        .type('application/json')
        .send({
          title: '🤷',
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'InternalValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 UnknownError if a generic Error is thrown when inserting', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => {
          throw new Error('This is unexpected');
        });
      const result = await agent
        .post('/opportunities')
        .type('application/json')
        .send({
          title: '🤷',
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'UnknownError',
        errors: expect.any(Array) as unknown[],
      });
    });

    it('returns 503 DatabaseError if an insufficient resources database error is thrown when inserting', async () => {
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
        .post('/opportunities')
        .type('application/json')
        .send({
          title: '🤷',
        })
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
