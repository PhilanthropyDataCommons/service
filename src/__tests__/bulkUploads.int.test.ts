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

describe('GET /bulkUploads', () => {
  it('returns an empty Bundle when no data is present', async () => {
    await agent
      .get('/bulkUploads')
      .set(authHeader)
      .expect(200, {
        total: 0,
        entries: [],
      });
  });

  it('returns bulk uploads present in the database', async () => {
    await db.sql('bulkUploads.insertOne', {
      fileName: 'foo.csv',
      sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
      status: BulkUploadStatus.PENDING,
    });
    await db.sql('bulkUploads.insertOne', {
      fileName: 'bar.csv',
      sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
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
                sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
                status: BulkUploadStatus.COMPLETED,
                createdAt: expectTimestamp,
              },
              {
                id: 1,
                fileName: 'foo.csv',
                sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
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
        sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
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
              sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
            {
              id: 14,
              fileName: 'bar-14.csv',
              sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
            {
              id: 13,
              fileName: 'bar-13.csv',
              sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
            {
              id: 12,
              fileName: 'bar-12.csv',
              sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
              status: BulkUploadStatus.COMPLETED,
              createdAt: expectTimestamp,
            },
            {
              id: 11,
              fileName: 'bar-11.csv',
              sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
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
          sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
        })
        .expect(201);
      const after = await loadTableMetrics('bulk_uploads');
      expect(before.count).toEqual(0);
      expect(result.body).toMatchObject({
        id: expect.any(Number) as number,
        fileName: 'foo.csv',
        sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
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
          sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
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
          sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 400 bad request when an invalid source key is provided', async () => {
      const result = await agent
        .post('/bulkUploads')
        .type('application/json')
        .set(authHeader)
        .send({
          fileName: 'foo.csv',
          sourceKey: 'notUnprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
        })
        .expect(400);
      expect(result.body).toMatchObject({
        name: 'InputValidationError',
        details: expect.any(Array) as unknown[],
      });
    });

    it('returns 400 bad request when no source key is provided', async () => {
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
