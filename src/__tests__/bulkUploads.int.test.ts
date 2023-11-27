import request from 'supertest';
import { app } from '../app';
import { loadTableMetrics } from '../database';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

const agent = request.agent(app);

describe('/bulkUploads', () => {
  describe('POST /', () => {
    it('creates exactly one bulk upload', async () => {
      const before = await loadTableMetrics('bulk_uploads');
      const result = await agent
        .post('/bulkUploads')
        .type('application/json')
        .set(authHeader)
        .send({
          fileName: 'foo.csv',
          sourceUrl: 'https://example.com/blah.csv',
        })
        .expect(201);
      const after = await loadTableMetrics('bulk_uploads');
      expect(before.count).toEqual(0);
      expect(result.body).toMatchObject({
        id: expect.any(Number) as number,
        fileName: 'foo.csv',
        sourceUrl: 'https://example.com/blah.csv',
        status: 'pending',
        createdAt: expectTimestamp,
      });
      expect(after.count).toEqual(1);
    });

    it('returns 400 bad request when no file name is provided', async () => {
      const result = await agent
        .post('/bulkUploads')
        .type('application/json')
        .set(authHeader)
        .send({
          sourceUrl: 'https://example.com/blah.csv',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 400 bad request when an invalid file name is provided', async () => {
      const result = await agent
        .post('/bulkUploads')
        .type('application/json')
        .set(authHeader)
        .send({
          fileName: 'foo.png',
          sourceUrl: 'https://example.com/blah.csv',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 400 bad request when an invalid url is provided', async () => {
      const result = await agent
        .post('/bulkUploads')
        .type('application/json')
        .set(authHeader)
        .send({
          fileName: 'foo.csv',
          sourceUrl: 'example.com/blah.csv',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 400 bad request when no source URL is provided', async () => {
      const result = await agent
        .post('/bulkUploads')
        .type('application/json')
        .set(authHeader)
        .send({
          fileName: 'foo.csv',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });
  });
});
