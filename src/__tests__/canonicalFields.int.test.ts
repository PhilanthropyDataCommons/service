import request from 'supertest';
import { TinyPgError } from 'tinypg';
import { app } from '../app';
import { db } from '../database';
import { getLogger } from '../logger';
import { PostgresErrorCode } from '../types';
import {
  isoTimestampPattern,
  getTableMetrics,
} from '../test/utils';
import { dummyApiKey } from '../test/dummyApiKey';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);
const fileWithApiTestKeys = 'test_keys.txt';
const environment = process.env;

describe('/canonicalFields', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    process.env = { ...environment, API_KEYS_FILE: fileWithApiTestKeys };
  });

  afterEach(() => {
    process.env = environment;
  });

  describe('GET /', () => {
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/canonicalFields')
        .set(dummyApiKey)
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
        .set(dummyApiKey)
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
        .set(dummyApiKey)
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'InternalValidationError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 UnknownError if a generic Error is thrown when selecting', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => {
          throw new Error('This is unexpected');
        });
      const result = await agent
        .get('/canonicalFields')
        .set(dummyApiKey)
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'UnknownError',
        details: expect.any(Array) as unknown[],
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
        .get('/canonicalFields')
        .set(dummyApiKey)
        .expect(503);
      expect(result.body).toMatchObject({
        name: 'DatabaseError',
        details: [{
          code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
        }],
      });
    });
  });

  describe('POST /', () => {
    it('creates exactly one canonical field', async () => {
      const before = await getTableMetrics('canonical_fields');
      logger.debug('before: %o', before);
      const result = await agent
        .post('/canonicalFields')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          label: '🏷️',
          shortCode: '🩳',
          dataType: '📊',
        })
        .expect(201);
      const after = await getTableMetrics('canonical_fields');
      logger.debug('after: %o', after);
      expect(before.count).toEqual('0');
      expect(result.body).toMatchObject({
        id: expect.any(Number) as number,
        label: '🏷️',
        shortCode: '🩳',
        dataType: '📊',
        createdAt: expect.stringMatching(isoTimestampPattern) as string,
      });
      expect(after.count).toEqual('1');
    });
    it('returns 400 bad request when no label is sent', async () => {
      const result = await agent
        .post('/canonicalFields')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          shortCode: '🩳',
          dataType: '📊',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });
    it('returns 400 bad request when no shortCode is sent', async () => {
      const result = await agent
        .post('/canonicalFields')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          label: '🏷️',
          dataType: '📊',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });
    it('returns 400 bad request when no dataType is sent', async () => {
      const result = await agent
        .post('/canonicalFields')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          label: '🏷️',
          shortCode: '🩳',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });
    it('returns 409 conflict when a duplicate short name is submitted', async () => {
      await db.query(`
        INSERT INTO canonical_fields (
          label,
          short_code,
          data_type,
          created_at
        )
        VALUES
          ( 'First Name', 'firstName', 'string', '2022-07-20 12:00:00+0000' );
      `);
      const result = await agent
        .post('/canonicalFields')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          label: '🏷️',
          shortCode: 'firstName',
          dataType: '📊',
        })
        .expect(409);
      expect(result.body).toMatchObject({
        name: 'DatabaseError',
        details: [{
          code: PostgresErrorCode.UNIQUE_VIOLATION,
        }],
      });
    });

    it('returns 500 UnknownError if a generic Error is thrown when inserting', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => {
          throw new Error('This is unexpected');
        });
      const result = await agent
        .post('/canonicalFields')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          label: '🏷️',
          shortCode: 'firstName',
          dataType: '📊',
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'UnknownError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 if the database returns an unexpected data structure', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid result' }],
        }) as Result<object>);
      const result = await agent
        .post('/canonicalFields')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          label: '🏷️',
          shortCode: '🩳',
          dataType: '📊',
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'InternalValidationError',
        details: expect.any(Array) as unknown[],
      });
    });
  });
});
