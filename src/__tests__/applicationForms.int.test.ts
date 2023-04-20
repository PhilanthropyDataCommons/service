import request from 'supertest';
import { TinyPgError } from 'tinypg';
import { app } from '../app';
import {
  db,
  loadTableMetrics,
} from '../database';
import { getLogger } from '../logger';
import { PostgresErrorCode } from '../types';
import { isoTimestampPattern } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
const agent = request.agent(app);

describe('/applicationForms', () => {
  describe('GET /', () => {
    it('returns an empty array when no data is present', async () => {
      await agent
        .get('/applicationForms')
        .set(authHeader)
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
        .set(authHeader)
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

    it('returns an application form without its fields', async () => {
      await db.query(`
        INSERT INTO opportunities (title)
        VALUES
          ( 'Summer opportunity 🩴' ),
          ( 'Spring opportunity 🌺' );
      `);
      await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2510-02-02 00:00:01+0000' ),
          ( 1, 2, '2510-02-02 00:00:02+0000' ),
          ( 2, 1, '2510-02-02 00:00:03+0000' )
      `);
      await db.query(`
      INSERT INTO canonical_fields (
        label,
        short_code,
        data_type,
        created_at
      )
      VALUES
        ( 'Organization Name', 'organizationName', '{ type: "string" }', '2510-02-02 00:00:04+0000' ),
        ( 'Years of work', 'yearsOfWork', '{ type: "integer" }', '2510-02-02 00:00:05+0000' );
      `);
      await agent
        .get('/applicationForms/2')
        .set(authHeader)
        .expect(
          200,
          {
            id: 2,
            opportunityId: 1,
            version: 2,
            createdAt: '2510-02-02T00:00:02.000Z',
          },
        );
    });

    it('returns an application form with its fields', async () => {
      await db.query(`
        INSERT INTO opportunities (title)
        VALUES
          ( 'Holiday opportunity 🎄' ),
          ( 'Another holiday opportunity 🕎' );
      `);
      await db.query(`
        INSERT INTO application_forms (
          opportunity_id,
          version,
          created_at
        )
        VALUES
          ( 1, 1, '2510-02-01 00:00:01+0000' ),
          ( 1, 2, '2510-02-01 00:00:02+0000' ),
          ( 2, 1, '2510-02-01 00:00:03+0000' )
      `);
      await db.query(`
      INSERT INTO canonical_fields (
        label,
        short_code,
        data_type,
        created_at
      )
      VALUES
        ( 'Organization Name', 'organizationName', '{ type: "string" }', '2510-02-01 00:00:04+0000' ),
        ( 'Years of work', 'yearsOfWork', '{ type: "integer" }', '2510-02-01 00:00:05+0000' );
      `);
      await db.query(`
        INSERT INTO application_form_fields (
          application_form_id,
          canonical_field_id,
          position,
          label,
          created_at
        )
        VALUES
          ( 3, 2, 1, 'Anni Worki', '2510-02-01 00:00:06+0000' ),
          ( 3, 1, 2, 'Org Nomen', '2510-02-01 00:00:07+0000' ),
          ( 2, 1, 2, 'Name of Organization', '2510-02-01 00:00:08+0000' ),
          ( 2, 2, 1, 'Duration of work in years', '2510-02-01 00:00:09+0000' )
      `);
      await agent
        .get('/applicationForms/2')
        .query({ includeFields: 'true' })
        .set(authHeader)
        .expect(
          200,
          {
            id: 2,
            opportunityId: 1,
            version: 2,
            fields: [
              {
                id: 4,
                applicationFormId: 2,
                canonicalFieldId: 2,
                position: 1,
                label: 'Duration of work in years',
                createdAt: '2510-02-01T00:00:09.000Z',
              },
              {
                id: 3,
                applicationFormId: 2,
                canonicalFieldId: 1,
                position: 2,
                label: 'Name of Organization',
                createdAt: '2510-02-01T00:00:08.000Z',
              },
            ],
            createdAt: '2510-02-01T00:00:02.000Z',
          },
        );
    });

    it('should error if the database returns an unexpected data structure', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid result' }],
        }) as Result<object>);
      const result = await agent
        .get('/applicationForms/2')
        .query({ includeFields: 'true' })
        .set(authHeader)
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
        .get('/applicationForms')
        .set(authHeader)
        .expect(503);
      expect(result.body).toMatchObject({
        name: 'DatabaseError',
        details: [{
          code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
        }],
      });
    });

    it('returns 503 DatabaseError if an insufficient resources database error is thrown when selecting one', async () => {
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
        .get('/applicationForms/3')
        .set(authHeader)
        .expect(503);
      expect(result.body).toMatchObject({
        name: 'DatabaseError',
        details: [{
          code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
        }],
      });
    });

    it('should error if the database returns an unexpected data structure', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid applicationForm' }],
        }) as Result<object>);
      const result = await agent
        .get('/applicationForms/5')
        .set(authHeader)
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'InternalValidationError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('should return 404 when the applicationForm is not found (shallow)', async () => {
      const result = await agent
        .get('/applicationForms/6')
        .set(authHeader)
        .expect(404);
      expect(result.body).toMatchObject({
        name: 'NotFoundError',
        details: expect.any(Array) as unknown[],
      });
    });
    it('should return 404 when the applicationForm is not found (with fields)', async () => {
      const result = await agent
        .get('/applicationForms/7')
        .query({ includeFields: 'true' })
        .set(authHeader)
        .expect(404);
      expect(result.body).toMatchObject({
        name: 'NotFoundError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('should return 500 when the application form fields returned are invalid', async () => {
      jest.spyOn(db, 'sql')
        .mockImplementationOnce(async () => ({
          command: '',
          row_count: 1,
          rows: [
            {
              id: 1,
              opportunityId: 1,
              version: 1,
              createdAt: new Date(),
            },
          ],
        }))
        .mockImplementationOnce(async () => ({
          rows: [{ foo: 'not a valid application form fields result' }],
        }) as Result<object>);
      const result = await agent
        .get('/applicationForms/8')
        .query({ includeFields: 'true' })
        .set(authHeader)
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'InternalValidationError',
        details: expect.any(Array) as unknown[],
      });
    });
  });

  it('should return 503 when the db has insufficient resources on application form fields select', async () => {
    jest.spyOn(db, 'sql')
      .mockImplementationOnce(async () => ({
        command: '',
        row_count: 1,
        rows: [
          {
            id: 1,
            opportunityId: 1,
            version: 1,
            createdAt: new Date(),
          },
        ],
      }))
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
      .get('/applicationForms/9')
      .query({ includeFields: 'true' })
      .set(authHeader)
      .expect(503);
    expect(result.body).toMatchObject({
      name: 'DatabaseError',
      details: [{
        code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
      }],
    });
  });

  it('returns 503 DatabaseError if an insufficient resources database error is thrown when selecting one', async () => {
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
      .get('/applicationForms/4')
      .set(authHeader)
      .query({ includeFields: 'true' })
      .expect(503);
    expect(result.body).toMatchObject({
      name: 'DatabaseError',
      details: [{
        code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
      }],
    });
  });

  describe('POST /', () => {
    it('creates exactly one application form', async () => {
      await db.query(`
        INSERT INTO opportunities ( title )
        VALUES ( 'Tremendous opportunity 👌' );
      `);
      const before = await loadTableMetrics('application_forms');
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(authHeader)
        .send({
          opportunityId: '1',
          fields: [],
        })
        .expect(201);
      const after = await loadTableMetrics('application_forms');
      logger.debug('after: %o', after);
      expect(before.count).toEqual(0);
      expect(result.body).toMatchObject({
        id: 1,
        opportunityId: 1,
        version: 1,
        createdAt: expect.stringMatching(isoTimestampPattern) as string,
      });
      expect(after.count).toEqual(1);
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
      const before = await loadTableMetrics('application_form_fields');
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(authHeader)
        .send({
          opportunityId: '1',
          fields: [{
            canonicalFieldId: '1',
            position: 1,
            label: 'Your First Name',
          }],
        })
        .expect(201);
      const after = await loadTableMetrics('application_form_fields');
      logger.debug('after: %o', after);
      expect(before.count).toEqual(0);
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
      expect(after.count).toEqual(1);
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
        .set(authHeader)
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
        .set(authHeader)
        .send({
          fields: [],
        })
        .expect(400);
    });

    it('returns 400 bad request when no fields value is provided', async () => {
      await agent
        .post('/applicationForms')
        .type('application/json')
        .set(authHeader)
        .send({
          opportunityId: 1,
        })
        .expect(400);
    });

    it('returns 400 bad request when an invalid field is provided', async () => {
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .set(authHeader)
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
        .set(authHeader)
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
        .set(authHeader)
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
        .set(authHeader)
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
        .set(authHeader)
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
        .set(authHeader)
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

  it('returns 503 when the db has insufficient resources on insert', async () => {
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
      .post('/applicationForms')
      .set(authHeader)
      .send({
        opportunityId: 9001,
        fields: [{
          canonicalFieldId: 9002,
          position: 9003,
          label: 'A label of some kind',
        }],
      })
      .expect(503);
    expect(result.body).toMatchObject({
      name: 'DatabaseError',
      details: [{
        code: PostgresErrorCode.INSUFFICIENT_RESOURCES,
      }],
    });
  });
});
