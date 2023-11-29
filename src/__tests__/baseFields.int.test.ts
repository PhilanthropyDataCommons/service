import request from 'supertest';
import { TinyPgError } from 'tinypg';
import { app } from '../app';
import {
  db,
  loadTableMetrics,
} from '../database';
import { getLogger } from '../logger';
import { PostgresErrorCode } from '../types';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

const logger = getLogger(__filename);
const agent = request.agent(app);

describe('/baseFields', () => {
  describe('GET /', () => {
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/baseFields')
        .set(authHeader)
        .expect(200, []);
    });

    it('returns all base fields present in the database', async () => {
      await db.sql('baseFields.insertOne', {
        label: 'First Name',
        shortCode: 'firstName',
        dataType: 'string',
      });
      await db.sql('baseFields.insertOne', {
        label: 'Last Name',
        shortCode: 'lastName',
        dataType: 'string',
      });
      const result = await agent
        .get('/baseFields')
        .set(authHeader)
        .expect(200);
      expect(result.body).toMatchObject([
        {
          id: 1,
          label: 'First Name',
          shortCode: 'firstName',
          dataType: 'string',
          createdAt: expectTimestamp,
        },
        {
          id: 2,
          label: 'Last Name',
          shortCode: 'lastName',
          dataType: 'string',
          createdAt: expectTimestamp,
        },
      ]);
    });

    it('returns 500 UnknownError if a generic Error is thrown when selecting', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => {
          throw new Error('This is unexpected');
        });
      const result = await agent
        .get('/baseFields')
        .set(authHeader)
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
        .get('/baseFields')
        .set(authHeader)
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
    it('creates exactly one base field', async () => {
      const before = await loadTableMetrics('base_fields');
      logger.debug('before: %o', before);
      const result = await agent
        .post('/baseFields')
        .type('application/json')
        .set(authHeader)
        .send({
          label: '🏷️',
          shortCode: '🩳',
          dataType: '📊',
        })
        .expect(201);
      const after = await loadTableMetrics('base_fields');
      logger.debug('after: %o', after);
      expect(before.count).toEqual(0);
      expect(result.body).toMatchObject({
        id: expect.any(Number) as number,
        label: '🏷️',
        shortCode: '🩳',
        dataType: '📊',
        createdAt: expectTimestamp,
      });
      expect(after.count).toEqual(1);
    });
    it('returns 400 bad request when no label is sent', async () => {
      const result = await agent
        .post('/baseFields')
        .type('application/json')
        .set(authHeader)
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
        .post('/baseFields')
        .type('application/json')
        .set(authHeader)
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
        .post('/baseFields')
        .type('application/json')
        .set(authHeader)
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
      await db.sql('baseFields.insertOne', {
        label: 'First Name',
        shortCode: 'firstName',
        dataType: 'string',
      });
      const result = await agent
        .post('/baseFields')
        .type('application/json')
        .set(authHeader)
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
        .post('/baseFields')
        .type('application/json')
        .set(authHeader)
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
  });
});
