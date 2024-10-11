import request from 'supertest';
import { app } from '../app';
import {
	createBulkUpload,
	createUser,
	loadSystemSource,
	loadSystemUser,
	loadTableMetrics,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithoutSub as authHeaderWithNoSub,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { BulkUploadStatus, keycloakUserIdToString } from '../types';

describe('/bulkUploads', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/bulkUploads').expect(401);
		});

		it('requires a user', async () => {
			await request(app)
				.get('/bulkUploads')
				.set(authHeaderWithNoSub)
				.expect(401);
		});

		it('returns an empty Bundle when no data is present', async () => {
			await request(app).get('/bulkUploads').set(authHeader).expect(200, {
				total: 0,
				entries: [],
			});
		});

		it('returns bulk uploads associated with the requesting user', async () => {
			const systemUser = await loadSystemUser();
			const systemSource = await loadSystemSource();
			const testUser = await loadTestUser();
			const thirdUser = await createUser({
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: BulkUploadStatus.PENDING,
				createdBy: testUser.keycloakUserId,
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: BulkUploadStatus.COMPLETED,
				createdBy: testUser.keycloakUserId,
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'baz.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-baz',
				status: BulkUploadStatus.COMPLETED,
				createdBy: systemUser.keycloakUserId,
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'boop.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-boop',
				status: BulkUploadStatus.COMPLETED,
				createdBy: thirdUser.keycloakUserId,
			});

			await request(app)
				.get('/bulkUploads')
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 4,
						entries: [
							{
								id: 2,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'bar.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 1,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'foo.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
								status: BulkUploadStatus.PENDING,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
						],
					}),
				);
		});

		it('returns all bulk uploads for administrative users', async () => {
			const systemSource = await loadSystemSource();
			const testUser = await loadTestUser();
			const anotherUser = await createUser({
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: BulkUploadStatus.PENDING,
				createdBy: testUser.keycloakUserId,
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: BulkUploadStatus.COMPLETED,
				createdBy: anotherUser.keycloakUserId,
			});

			await request(app)
				.get('/bulkUploads')
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'bar.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: anotherUser.keycloakUserId,
							},
							{
								id: 1,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'foo.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
								status: BulkUploadStatus.PENDING,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
						],
					}),
				);
		});

		it('returns uploads for specified createdBy user', async () => {
			const systemSource = await loadSystemSource();
			const testUser = await loadTestUser();
			const anotherUser = await createUser({
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: BulkUploadStatus.PENDING,
				createdBy: testUser.keycloakUserId,
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: BulkUploadStatus.COMPLETED,
				createdBy: anotherUser.keycloakUserId,
			});

			await request(app)
				.get(
					`/bulkUploads?createdBy=${keycloakUserIdToString(anotherUser.keycloakUserId)}`,
				)
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'bar.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: anotherUser.keycloakUserId,
							},
						],
					}),
				);
		});

		it('returns uploads for the admin user when createdBy is set to me as an admin', async () => {
			const systemSource = await loadSystemSource();
			const testUser = await loadTestUser();
			const anotherUser = await createUser({
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: BulkUploadStatus.PENDING,
				createdBy: testUser.keycloakUserId,
			});
			await createBulkUpload({
				sourceId: systemSource.id,
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: BulkUploadStatus.COMPLETED,
				createdBy: anotherUser.keycloakUserId,
			});

			await request(app)
				.get(`/bulkUploads?createdBy=me`)
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 1,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'foo.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
								status: BulkUploadStatus.PENDING,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
						],
					}),
				);
		});

		it('supports pagination', async () => {
			const systemSource = await loadSystemSource();
			const testUser = await loadTestUser();
			await Array.from(Array(20)).reduce(async (p, _, i) => {
				await p;
				await createBulkUpload({
					sourceId: systemSource.id,
					fileName: `bar-${i + 1}.csv`,
					sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
					status: BulkUploadStatus.COMPLETED,
					createdBy: testUser.keycloakUserId,
				});
			}, Promise.resolve());

			await request(app)
				.get('/bulkUploads')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 20,
						entries: [
							{
								id: 15,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'bar-15.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 14,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'bar-14.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 13,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'bar-13.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 12,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'bar-12.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 11,
								sourceId: systemSource.id,
								source: systemSource,
								fileName: 'bar-11.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
							},
						],
					}),
				);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/bulkUploads').expect(401);
		});

		it('requires a user', async () => {
			await request(app)
				.post('/bulkUploads')
				.set(authHeaderWithNoSub)
				.expect(401);
		});

		it('creates exactly one bulk upload', async () => {
			const systemSource = await loadSystemSource();
			const before = await loadTableMetrics('bulk_uploads');
			const result = await request(app)
				.post('/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					fileName: 'foo.csv',
					sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				})
				.expect(201);
			const after = await loadTableMetrics('bulk_uploads');
			const testUser = await loadTestUser();

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				id: expect.any(Number) as number,
				sourceId: systemSource.id,
				source: systemSource,
				fileName: 'foo.csv',
				fileSize: null,
				sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: 'pending',
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no file name is provided', async () => {
			const systemSource = await loadSystemSource();
			const result = await request(app)
				.post('/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when an invalid file name is provided', async () => {
			const systemSource = await loadSystemSource();
			const result = await request(app)
				.post('/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					fileName: 'foo.png',
					sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when an invalid source key is provided', async () => {
			const result = await request(app)
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
			const result = await request(app)
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
