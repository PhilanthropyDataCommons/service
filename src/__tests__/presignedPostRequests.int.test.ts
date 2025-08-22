// Jest hoists .mock() calls, so this needs to go before imports.
// See https://stackoverflow.com/a/67595592/159522
const mockedCreatePresignedPost = jest.fn();
import request from 'supertest';
import { requireEnv } from 'require-env-variable';
import { app } from '../app';
import { createFile, loadSystemUser } from '../database/operations';
import { db } from '../database';
import { mockJwt as authHeader } from '../test/mockJwt';
import { getTestAuthContext, getAuthContext } from '../test/utils';

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
			const testAuthContext = await getTestAuthContext();
			const file = await createFile(db, testAuthContext, {
				mimeType: 'application/octet-stream',
				size: 512,
			});

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
					fileUuid: file.uuid,
				})
				.expect(201);

			expect(mockedCreatePresignedPost).toHaveBeenCalledWith(
				expect.anything(),
				{
					Bucket: S3_BUCKET,
					Key: file.uuid,
					Expires: 3600,
					Conditions: [
						['eq', '$Content-Type', 'application/octet-stream'],
						['content-length-range', 512, 512],
					],
				},
			);
			expect(result.body).toMatchObject({
				fileUuid: file.uuid,
				presignedPost: mockedPresignedPost,
			});
		});

		it('Returns 400 when fileUuid is missing', async () => {
			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({})
				.expect(400);
		});

		it('Returns 400 when fileUuid is invalid', async () => {
			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileUuid: 'invalid-guid',
				})
				.expect(400);
		});

		it('Returns 400 when file does not exist', async () => {
			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileUuid: '00000000-0000-4000-8000-000000000000',
				})
				.expect(400);
		});

		it('Returns 400 when user does not own the file', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const file = await createFile(db, systemUserAuthContext, {
				mimeType: 'application/octet-stream',
				size: 512,
			});

			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileUuid: file.uuid,
				})
				.expect(400);
		});

		it('Returns 500 if something goes wrong with the presigned post', async () => {
			const testAuthContext = await getTestAuthContext();
			const file = await createFile(db, testAuthContext, {
				mimeType: 'application/octet-stream',
				size: 512,
			});

			mockedCreatePresignedPost.mockImplementationOnce(() => {
				throw new Error('Failed to create the presigned post!');
			});

			await request(app)
				.post('/presignedPostRequests')
				.type('application/json')
				.set(authHeader)
				.send({
					fileUuid: file.uuid,
				})
				.expect(500);
		});
	});
});
