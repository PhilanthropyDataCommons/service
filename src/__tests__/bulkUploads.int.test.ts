import request from 'supertest';
import { app } from '../app';
import {
  db,
  loadTableMetrics,
} from '../database';
import { expectTimestamp } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import { BulkUploadStatus } from '../types';

const agent = request.agent(app);

describe('/bulkUploads', () => {
  it('returns an empty Bundle when no data is present', async () => {
    await agent
      .get('/bulkUploads')
      .set(authHeader)
      .expect(200, {
        total: 0,
        entries: [],
      });
  });

  it('returns proposals present in the database', async () => {
    await db.sql('bulkUploads.insertOne', {
      fileName: 'foo.csv',
      sourceUrl: 'https://example.com/foo.csv',
      status: BulkUploadStatus.PENDING,
    });
    await db.sql('bulkUploads.insertOne', {
      fileName: 'bar.csv',
      sourceUrl: 'https://example.com/bar.csv',
      status: BulkUploadStatus.COMPLETED,
    });

    await agent
      .get('/bulkUploads')
      .set(authHeader)
      .expect(200)
      .expect(
        (res) => expect(res.body).toEqual(
          {
            total: 2,
            entries: [
              {
                id: 2,
                fileName: 'bar.csv',
                sourceUrl: 'https://example.com/bar.csv',
                status: BulkUploadStatus.COMPLETED,
                createdAt: expectTimestamp,
              },
              {
                id: 1,
                fileName: 'foo.csv',
                sourceUrl: 'https://example.com/foo.csv',
                status: BulkUploadStatus.PENDING,
                createdAt: expectTimestamp,
              },
            ],
          },
        ),
      );
  });

  it('supports pagination', async () => {
    await Array.from(Array(20)).reduce(async (p, _, i) => {
      await p;
      await db.sql('bulkUploads.insertOne', {
        fileName: `bar-${i + 1}.csv`,
        sourceUrl: 'https://example.com/bar.csv',
        status: BulkUploadStatus.COMPLETED,
      });
    }, Promise.resolve());

    await agent
      .get('/bulkUploads')
      .query({
        _page: 2,
        _count: 5,
      })
      .set(authHeader)
      .expect(200)
      .expect(
        (res) => expect(res.body).toEqual({
          total: 20,
          entries: [
            {
              id: 15,
              fileName: 'bar-15.csv',
              sourceUrl: 'https://example.com/bar.csv',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
            {
              id: 14,
              fileName: 'bar-14.csv',
              sourceUrl: 'https://example.com/bar.csv',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
            {
              id: 13,
              fileName: 'bar-13.csv',
              sourceUrl: 'https://example.com/bar.csv',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
            {
              id: 12,
              fileName: 'bar-12.csv',
              sourceUrl: 'https://example.com/bar.csv',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
            {
              id: 11,
              fileName: 'bar-11.csv',
              sourceUrl: 'https://example.com/bar.csv',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
          ],
        }),
      );
  });

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