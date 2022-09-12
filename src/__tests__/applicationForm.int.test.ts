import request from 'supertest';
import { app } from '../app';
import {
  db,
  PostgressErrorCode,
} from '../database';
import { getLogger } from '../logger';
import {
  isoTimestampPattern,
  getTableMetrics,
} from '../test/utils';
import type { Result } from 'tinypg';

const logger = getLogger(__filename);
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
        name: 'ValidationError',
        errors: expect.any(Array) as unknown[],
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
        .send({
          opportunityId: '1',
          fields: [{
            canonicalFieldId: 1,
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
        .send({
          fields: [],
        })
        .expect(400);
    });

    it('returns 400 bad request when no fields are provided', async () => {
      await agent
        .post('/applicationForms')
        .type('application/json')
        .send({
          opportunityId: 1,
        })
        .expect(400);
    });

    it('returns 400 bad request when an invalid field is provided', async () => {
      await agent
        .post('/applicationForms')
        .type('application/json')
        .send({
          opportunityId: 1,
          fields: [{
            foo: 'not a field',
          }],
        })
        .expect(400);
    });

    it('returns 409 conflict when a non-existant opportunity id is provided', async () => {
      const result = await agent
        .post('/applicationForms')
        .type('application/json')
        .send({
          opportunityId: 1,
          fields: [],
        })
        .expect(409);
      expect(result.body).toMatchObject({
        errors: [{
          code: PostgressErrorCode.FOREIGN_KEY_VIOLATION,
        }],
      });
    });

    it('returns 500 if the database returns an unexpected data structure', async () => {
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
        .send({
          opportunityId: 1,
          fields: [],
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'ValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });

    it('returns 500 if the database returns an unexpected data structure when collecting fields', async () => {
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
        .send({
          opportunityId: 1,
          fields: [],
        })
        .expect(500);
      expect(result.body).toMatchObject({
        name: 'ValidationError',
        errors: expect.any(Array) as unknown[],
      });
    });
  });
});
