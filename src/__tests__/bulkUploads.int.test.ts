import request from 'supertest';
import { app } from '../app';
import {
	createBulkUpload,
	createUser,
	loadSystemUser,
	loadTableMetrics,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithoutSub as authHeaderWithNoSub,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { BulkUploadStatus } from '../types';

const agent = request.agent(app);

describe('/bulkUploads', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/bulkUploads').expect(401);
		});

		it('requires a user', async () => {
			await agent.get('/bulkUploads').set(authHeaderWithNoSub).expect(401);
		});

		it('returns an empty Bundle when no data is present', async () => {
			await agent.get('/bulkUploads').set(authHeader).expect(200, {
				total: 0,
				entries: [],
			});
		});

		it('returns bulk uploads associated with the requesting user', async () => {
			const systemUser = await loadSystemUser();
			const testUser = await loadTestUser();
			const thirdUser = await createUser({
				authenticationId: 'totallyDifferentUser@example.com',
			});
			await createBulkUpload({
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: BulkUploadStatus.PENDING,
				createdBy: testUser.id,
			});
			await createBulkUpload({
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: BulkUploadStatus.COMPLETED,
				createdBy: testUser.id,
			});
			await createBulkUpload({
				fileName: 'baz.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-baz',
				status: BulkUploadStatus.COMPLETED,
				createdBy: systemUser.id,
			});
			await createBulkUpload({
				fileName: 'boop.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-boop',
				status: BulkUploadStatus.COMPLETED,
				createdBy: thirdUser.id,
			});

			await agent
				.get('/bulkUploads')
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 4,
						entries: [
							{
								id: 2,
								fileName: 'bar.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.id,
							},
							{
								id: 1,
								fileName: 'foo.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
								status: BulkUploadStatus.PENDING,
								createdAt: expectTimestamp,
								createdBy: testUser.id,
							},
						],
					}),
				);
		});

		it('returns all bulk uploads for administrative users', async () => {
			const testUser = await loadTestUser();
			const anotherUser = await createUser({
				authenticationId: 'totallyDifferentUser@example.com',
			});
			await createBulkUpload({
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: BulkUploadStatus.PENDING,
				createdBy: testUser.id,
			});
			await createBulkUpload({
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: BulkUploadStatus.COMPLETED,
				createdBy: anotherUser.id,
			});

			await agent
				.get('/bulkUploads')
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								fileName: 'bar.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: anotherUser.id,
							},
							{
								id: 1,
								fileName: 'foo.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
								status: BulkUploadStatus.PENDING,
								createdAt: expectTimestamp,
								createdBy: testUser.id,
							},
						],
					}),
				);
		});

		it('returns uploads for specified createdBy user', async () => {
			const testUser = await loadTestUser();
			const anotherUser = await createUser({
				authenticationId: 'totallyDifferentUser@example.com',
			});
			await createBulkUpload({
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: BulkUploadStatus.PENDING,
				createdBy: testUser.id,
			});
			await createBulkUpload({
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: BulkUploadStatus.COMPLETED,
				createdBy: anotherUser.id,
			});

			await agent
				.get(`/bulkUploads?createdBy=${anotherUser.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								fileName: 'bar.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: anotherUser.id,
							},
						],
					}),
				);
		});

		it('supports pagination', async () => {
			const testUser = await loadTestUser();
			await Array.from(Array(20)).reduce(async (p, _, i) => {
				await p;
				await createBulkUpload({
					fileName: `bar-${i + 1}.csv`,
					sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
					status: BulkUploadStatus.COMPLETED,
					createdBy: testUser.id,
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
				.expect((res) =>
					expect(res.body).toEqual({
						total: 20,
						entries: [
							{
								id: 15,
								fileName: 'bar-15.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.id,
							},
							{
								id: 14,
								fileName: 'bar-14.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.id,
							},
							{
								id: 13,
								fileName: 'bar-13.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.id,
							},
							{
								id: 12,
								fileName: 'bar-12.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.id,
							},
							{
								id: 11,
								fileName: 'bar-11.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: BulkUploadStatus.COMPLETED,
								createdAt: expectTimestamp,
								createdBy: testUser.id,
							},
						],
					}),
				);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/bulkUploads').expect(401);
		});

		it('requires a user', async () => {
			await agent.post('/bulkUploads').set(authHeaderWithNoSub).expect(401);
		});

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
			const testUser = await loadTestUser();

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				id: expect.any(Number) as number,
				fileName: 'foo.csv',
				fileSize: null,
				sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: 'pending',
				createdAt: expectTimestamp,
				createdBy: testUser.id,
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
