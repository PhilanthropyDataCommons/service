// Jest hoists .mock() calls, so this needs to go before imports.
// See https://stackoverflow.com/a/67595592/159522
const mockedCreatePresignedPost = jest.fn();
import request from 'supertest';
import { requireEnv } from 'require-env-variable';
import { app } from '../app';
import { mockJwt as authHeader } from '../test/mockJwt';
import { expectString } from '../test/asymettricMatchers';

const { S3_BUCKET } = requireEnv('S3_BUCKET');

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-presigned-post', () => ({
	createPresignedPost: mockedCreatePresignedPost,
}));

describe('/presignedPostRequests', () => {
	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/presignedPostRequests').expect(401);
		});

		it('invokes the S3 API to generate a presigned post', async () => {
			const mockedPresignedPost = {
				url: 'https://example.com',
				fields: {
					key: 'key',
					Policy: '',
				},
			};
			mockedCreatePresignedPost.mockImplementationOnce(
				() => mockedPresignedPost,
			);

			const result = await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileSize: 512,
					fileType: 'application/octet-stream',
				})
				.expect(201);

			expect(mockedCreatePresignedPost).toHaveBeenCalledWith(
				expect.anything(),
				{
					Bucket: S3_BUCKET,
					Key: expectString(),
					Expires: 3600,
					Conditions: [
						['eq', '$Content-Type', 'application/octet-stream'],
						['content-length-range', 512, 512],
					],
				},
			);
			expect(result.body).toMatchObject({
				fileSize: 512,
				fileType: 'application/octet-stream',
				presignedPost: mockedPresignedPost,
			});
		});

		it('Returns 400 when an invalid file size is provided', async () => {
			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileSize: -1,
					fileType: 'application/octet-stream',
				})
				.expect(400);
		});

		it('Returns 400 when file type is missing', async () => {
			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileSize: 1028,
				})
				.expect(400);
		});

		it('Returns 400 when file size is missing', async () => {
			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileType: 'application/octet-stream',
				})
				.expect(400);
		});

		it('Returns 500 if something goes wrong with the presigned post', async () => {
			mockedCreatePresignedPost.mockImplementationOnce(() => {
				throw new Error('Failed to create the presigned post!');
			});

			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileSize: 512,
					fileType: 'application/octet-stream',
				})
				.expect(500);
		});
	});
});
