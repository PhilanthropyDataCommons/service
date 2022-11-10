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

describe('/applicationForms', () => {
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
        .get('/applicationForms')
        .expect(200, []);
    });

    it('returns all application forms present in the database', async () => {
      await db.query(`
        INSERT INTO opportunities (title)
        VALUES
          ( 'Tremendous opportunity 👌' ),
          ( 'Good opportunity' );
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
        .get('/applicationForms')
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
        .get('/applicationForms')
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
    it('creates exactly one application form', async () => {
      await db.query(`
        INSERT INTO opportunities ( title )
        VALUES ( 'Tremendous opportunity 👌' );
      `);
      const before = await getTableMetrics('application_forms');
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: '1',
          fields: [],
        })
        .expect(201);
      const after = await getTableMetrics('application_forms');
      logger.debug('after: %o', after);
      expect(before.count).toEqual('0');
      expect(result.body).toMatchObject({
        id: 1,
        opportunityId: 1,
        version: 1,
        createdAt: expect.stringMatching(isoTimestampPattern) as string,
      });
      expect(after.count).toEqual('1');
    });

    it('creates exactly the number of provided fields', async () => {
      await db.query(`
        INSERT INTO opportunities ( title )
        VALUES ( 'Tremendous opportunity 👌' );
      `);
      await db.query(`
        INSERT INTO canonical_fields (
          label,
          short_code,
          data_type
        )
        VALUES
          ( 'First Name', 'firstName', 'string' );
      `);
      const before = await getTableMetrics('application_form_fields');
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: '1',
          fields: [{
            canonicalFieldId: '1',
            position: 1,
            label: 'Your First Name',
          }],
        })
        .expect(201);
      const after = await getTableMetrics('application_form_fields');
      logger.debug('after: %o', after);
      expect(before.count).toEqual('0');
      expect(result.body).toMatchObject({
        id: 1,
        opportunityId: 1,
        version: 1,
        fields: [{
          applicationFormId: 1,
          canonicalFieldId: 1,
          createdAt: expect.stringMatching(isoTimestampPattern) as string,
          id: 1,
          label: 'Your First Name',
          position: 1,
        }],
        createdAt: expect.stringMatching(isoTimestampPattern) as string,
      });
      expect(after.count).toEqual('1');
    });

    it('increments version when creating a second form for an opportunity', async () => {
      await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' );
      `);
      await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2022-07-20 12:00:00+0000' ),
          ( 1, 2, '2022-08-20 12:00:00+0000' )
      `);
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: '1',
          fields: [],
        })
        .expect(201);
      expect(result.body).toMatchObject({
        id: 3,
        opportunityId: 1,
        version: 3,
        createdAt: expect.stringMatching(isoTimestampPattern) as string,
      });
    });

    it('returns 400 bad request when no opportunity id is provided', async () => {
      await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          fields: [],
        })
        .expect(400);
    });

    it('returns 400 bad request when no fields value is provided', async () => {
      await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: 1,
        })
        .expect(400);
    });

    it('returns 400 bad request when an invalid field is provided', async () => {
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: 1,
          fields: [{
            foo: 'not a field',
          }],
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 409 conflict when a non-existent opportunity id is provided', async () => {
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: 1,
          fields: [],
        })
        .expect(409);
      expect(result.body).toMatchObject({
        name: 'DatabaseError',
        details: [{
          code: PostgresErrorCode.FOREIGN_KEY_VIOLATION,
        }],
      });
    });

    it('returns 500 UnknownError if a generic Error is thrown when inserting the form', async () => {
      await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' );
      `);
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => {
          throw new Error('This is unexpected');
        });
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: 1,
          fields: [],
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'UnknownError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 if the database returns an unexpected data structure when inserting the form', async () => {
      await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' );
      `);
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid result' }],
        }) as Result<object>);
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: 1,
          fields: [],
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'InternalValidationError',
        message: 'The database responded with an unexpected format when creating the form.',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 UnknownError if a generic Error is thrown when inserting the field', async () => {
      await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' );
      `);
      await db.query(`
        INSERT INTO canonical_fields (
          label,
          short_code,
          data_type
        )
        VALUES
          ( 'First Name', 'firstName', 'string' );
      `);
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          command: '',
          row_count: 1,
          rows: [
            {
              id: 1,
              opportunityId: 1,
              version: 1,
              fields: [],
              createdAt: new Date(),
            },
          ],
        }))
        .mockImplementationOnce(async () => {
          throw new Error('This is unexpected');
        });
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: '1',
          fields: [{
            canonicalFieldId: '1',
            position: 1,
            label: 'Your First Name',
          }],
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'UnknownError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 if the database returns an unexpected data structure when inserting the field', async () => {
      await db.query(`
        INSERT INTO opportunities (
          title,
          created_at
        )
        VALUES
          ( 'Tremendous opportunity 👌', '2525-01-01T00:00:05Z' );
      `);
      await db.query(`
        INSERT INTO canonical_fields (
          label,
          short_code,
          data_type
        )
        VALUES
          ( 'First Name', 'firstName', 'string' );
      `);
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          command: '',
          row_count: 1,
          rows: [
            {
              id: 1,
              opportunityId: 1,
              version: 1,
              fields: [],
              createdAt: new Date(),
            },
          ],
        }))
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid result' }],
        }) as Result<object>);
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(dummyApiKey)
        .send({
          opportunityId: '1',
          fields: [{
            canonicalFieldId: '1',
            position: 1,
            label: 'Your First Name',
          }],
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'InternalValidationError',
        message: 'The database responded with an unexpected format when creating a field.',
        details: expect.any(Array) as unknown[],
      });
    });
  });
});
