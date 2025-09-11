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
				s3BucketName: process.env.S3_BUCKET,
				createdBy: expectString(),
				createdAt: expectTimestamp(),
			});
		});

		it('references an s3_bucket record', async () => {
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
				s3BucketName: process.env.S3_BUCKET,
			});
		});

		it('ignores user-provided s3BucketName values', async () => {
			const result = await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'malicious-test.pdf',
					mimeType: 'application/pdf',
					size: 256,
					s3BucketName: 'some-user-provided-bucket-value',
				})
				.expect(201);

			expect(result.body).toMatchObject({
				s3BucketName: process.env.S3_BUCKET,
			});
			expect(result.body).not.toMatchObject({
				s3BucketName: 'some-user-provided-bucket-value',
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
