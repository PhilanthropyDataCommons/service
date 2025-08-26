// Jest hoists .mock() calls, so this needs to go before imports.
// See https://stackoverflow.com/a/67595592/159522
const mockedGeneratePresignedPost = jest.fn();
import request from 'supertest';
import { app } from '../app';
import { mockJwt as authHeader } from '../test/mockJwt';
import {
	expectNumber,
	expectString,
	expectTimestamp,
} from '../test/asymettricMatchers';

jest.mock('@aws-sdk/client-s3');
jest.mock('../s3', () => ({
	generatePresignedPost: mockedGeneratePresignedPost,
}));

describe('/files', () => {
	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/files').expect(401);
		});

		it('creates a file and returns it with a generated presigned post', async () => {
			const result = await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'test-document.pdf',
					mimeType: 'application/pdf',
					size: 1024,
				})
				.expect(201);

			expect(result.body).toMatchObject({
				id: expectNumber(),
				name: 'test-document.pdf',
				mimeType: 'application/pdf',
				size: 1024,
				storageKey: expectString(),
				bucketName: expectString(),
				bucketRegion: expectString(),
				createdBy: expectString(),
				createdAt: expectTimestamp(),
			});
		});

		it('populates bucketName and bucketRegion from environment variables', async () => {
			const result = await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'env-test.pdf',
					mimeType: 'application/pdf',
					size: 512,
				})
				.expect(201);

			expect(result.body).toMatchObject({
				bucketName: process.env.S3_BUCKET,
				bucketRegion: process.env.S3_REGION,
			});
		});

		it('ignores user-provided bucketName and bucketRegion values', async () => {
			const result = await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'malicious-test.pdf',
					mimeType: 'application/pdf',
					size: 256,
					bucketName: 'user-provided-bucket',
					bucketRegion: 'user-provided-region',
				})
				.expect(201);

			// Should use environment variables, not user-provided values
			expect(result.body).toMatchObject({
				bucketName: process.env.S3_BUCKET,
				bucketRegion: process.env.S3_REGION,
			});
			// Ensure each field individually rejects user input
			expect(result.body).not.toMatchObject({
				bucketName: 'user-provided-bucket',
			});
			expect(result.body).not.toMatchObject({
				bucketRegion: 'user-provided-region',
			});
		});

		it('returns 400 when mimeType is missing', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'test.pdf',
					size: 1024,
				})
				.expect(400);
		});

		it('returns 400 when size is missing', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'test.pdf',
					mimeType: 'application/pdf',
				})
				.expect(400);
		});

		it('returns 400 when size is negative', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'test.pdf',
					mimeType: 'application/pdf',
					size: -1,
				})
				.expect(400);
		});

		it('returns 400 when request body is empty', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({})
				.expect(400);
		});
	});
});
