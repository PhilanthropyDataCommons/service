import { mockClient } from 'aws-sdk-client-mock';
import { S3Client } from '@aws-sdk/client-s3';
import request from 'supertest';
import { app } from '../app';
import { db, loadSystemUser } from '../database';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import {
	expectArrayContaining,
	expectNumber,
	expectObjectContaining,
	expectString,
	expectTimestamp,
} from '../test/asymettricMatchers';
import { getAuthContext } from '../test/utils';
import { createTestFile } from '../test/factories';

const s3Mock = mockClient(S3Client);

describe('/files', () => {
	beforeEach(() => {
		s3Mock.reset();
	});

	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/files').expect(401);
		});

		it('returns an empty bundle when no files exist', async () => {
			const response = await request(app)
				.get('/files')
				.set(authHeader)
				.expect(200);

			expect(response.body).toEqual({
				entries: [],
				total: 0,
			});
		});

		it('returns files created by the authenticated user', async () => {
			// Create a file first
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'get-test.pdf',
					mimeType: 'application/pdf',
					size: 2048,
				})
				.expect(201);

			const response = await request(app)
				.get('/files')
				.set(authHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				entries: expectArrayContaining([
					expectObjectContaining({
						id: expectNumber(),
						name: 'get-test.pdf',
						mimeType: 'application/pdf',
						size: 2048,
						storageKey: expectString(),
						s3BucketName: process.env.S3_BUCKET,
						createdBy: expectString(),
						createdAt: expectTimestamp(),
						downloadUrl: expectString(),
					}),
				]),
			});
		});

		it('supports pagination parameters', async () => {
			// Create two files for pagination test
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'pagination-test-1.pdf',
					mimeType: 'application/pdf',
					size: 100,
				})
				.expect(201);

			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'pagination-test-2.pdf',
					mimeType: 'application/pdf',
					size: 200,
				})
				.expect(201);

			const response = await request(app)
				.get('/files?_count=1')
				.set(authHeader)
				.expect(200);

			// With _count=1, we should get exactly 1 entry but total should reflect all files
			expect(response.body).toMatchObject({
				entries: [expect.objectContaining({ id: expectNumber() })],
			});
		});

		it('includes downloadUrl in each file entry', async () => {
			await request(app)
				.post('/files')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'download-url-test.pdf',
					mimeType: 'application/pdf',
					size: 512,
				})
				.expect(201);

			const response = await request(app)
				.get('/files')
				.set(authHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				entries: expectArrayContaining([
					expectObjectContaining({
						name: 'download-url-test.pdf',
						downloadUrl: expectString(),
					}),
				]),
			});
		});

		it('does not return files created by other users for non-admin users', async () => {
			// Create a file as the system user (different from the test user)
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			await createTestFile(db, systemUserAuthContext, {
				name: 'system-user-file.pdf',
				mimeType: 'application/pdf',
				size: 1024,
			});

			// List files as the regular test user (non-admin)
			const response = await request(app)
				.get('/files')
				.set(authHeader)
				.expect(200);

			// Should not see the file created by the system user
			// Note: total reflects all files in the database, not just accessible ones
			expect(response.body).toMatchObject({
				entries: [],
			});
		});

		it('returns files created by other users for admin users', async () => {
			// Create a file as the system user (different from the test user)
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const file = await createTestFile(db, systemUserAuthContext, {
				name: 'admin-visible-file.pdf',
				mimeType: 'application/pdf',
				size: 2048,
			});

			// List files as an admin user
			const response = await request(app)
				.get('/files')
				.set(authHeaderWithAdminRole)
				.expect(200);

			// Admin should see the file created by the system user
			expect(response.body).toMatchObject({
				entries: expectArrayContaining([
					expectObjectContaining({
						id: file.id,
						name: 'admin-visible-file.pdf',
						createdBy: systemUser.keycloakUserId,
					}),
				]),
			});
		});
	});

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
