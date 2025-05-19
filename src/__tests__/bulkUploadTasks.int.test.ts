import request from 'supertest';
import { app } from '../app';
import {
	db,
	createBulkUploadTask,
	createOrUpdateUser,
	loadSystemSource,
	loadSystemUser,
	loadTableMetrics,
	loadSystemFunder,
	createOrUpdateUserFunderPermission,
	createOrUpdateFunder,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import {
	expectArray,
	expectNumber,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithoutSub as authHeaderWithNoSub,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { Permission, TaskStatus, keycloakIdToString } from '../types';

describe('/tasks/bulkUploads', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/tasks/bulkUploads').expect(401);
		});

		it('requires a user', async () => {
			await request(app)
				.get('/tasks/bulkUploads')
				.set(authHeaderWithNoSub)
				.expect(401);
		});

		it('returns an empty Bundle when no data is present', async () => {
			await request(app).get('/tasks/bulkUploads').set(authHeader).expect(200, {
				total: 0,
				entries: [],
			});
		});

		it('returns all bulk upload tasks that the user is allowed to view', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const anotherFunder = await createOrUpdateFunder(db, null, {
				shortCode: 'anotherFunder',
				name: 'Another Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			await createBulkUploadTask(db, testUserAuthContext, {
				sourceId: systemSource.id,
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: TaskStatus.PENDING,
				funderShortCode: systemFunder.shortCode,
			});
			await createBulkUploadTask(db, testUserAuthContext, {
				sourceId: systemSource.id,
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: TaskStatus.COMPLETED,
				funderShortCode: anotherFunder.shortCode,
			});

			await request(app)
				.get('/tasks/bulkUploads')
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 1,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'foo.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
								status: TaskStatus.PENDING,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
						],
					});
				});
		});

		it('returns all bulk uploads for administrative users', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			const anotherUserAuthContext = getAuthContext(anotherUser);
			await createBulkUploadTask(db, testUserAuthContext, {
				sourceId: systemSource.id,
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: TaskStatus.PENDING,
				funderShortCode: systemFunder.shortCode,
			});
			await createBulkUploadTask(db, anotherUserAuthContext, {
				sourceId: systemSource.id,
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: TaskStatus.COMPLETED,
				funderShortCode: systemFunder.shortCode,
			});

			await request(app)
				.get('/tasks/bulkUploads')
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'bar.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: TaskStatus.COMPLETED,
								createdAt: expectTimestamp(),
								createdBy: anotherUser.keycloakUserId,
							},
							{
								id: 1,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'foo.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
								status: TaskStatus.PENDING,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
						],
					});
				});
		});

		it('returns upload tasks for specified createdBy user', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			const anotherUserAuthContext = getAuthContext(anotherUser);
			await createBulkUploadTask(db, testUserAuthContext, {
				sourceId: systemSource.id,
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: TaskStatus.PENDING,
				funderShortCode: systemFunder.shortCode,
			});
			await createBulkUploadTask(db, anotherUserAuthContext, {
				sourceId: systemSource.id,
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: TaskStatus.COMPLETED,
				funderShortCode: systemFunder.shortCode,
			});

			await request(app)
				.get(
					`/tasks/bulkUploads?createdBy=${keycloakIdToString(anotherUser.keycloakUserId)}`,
				)
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'bar.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: TaskStatus.COMPLETED,
								createdAt: expectTimestamp(),
								createdBy: anotherUser.keycloakUserId,
							},
						],
					});
				});
		});

		it('returns upload tasks for the admin user when createdBy is set to me as an admin', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			const anotherUserAuthContext = getAuthContext(anotherUser);
			await createBulkUploadTask(db, testUserAuthContext, {
				sourceId: systemSource.id,
				fileName: 'foo.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
				status: TaskStatus.PENDING,
				funderShortCode: systemFunder.shortCode,
			});
			await createBulkUploadTask(db, anotherUserAuthContext, {
				sourceId: systemSource.id,
				fileName: 'bar.csv',
				sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: TaskStatus.COMPLETED,
				funderShortCode: systemFunder.shortCode,
			});

			await request(app)
				.get(`/tasks/bulkUploads?createdBy=me`)
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 1,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'foo.csv',
								fileSize: null,
								sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-foo',
								status: TaskStatus.PENDING,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
						],
					});
				});
		});

		it('supports pagination', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			await Array.from(Array(20)).reduce(async (p, _, i) => {
				await p;
				await createBulkUploadTask(db, testUserAuthContext, {
					sourceId: systemSource.id,
					fileName: `bar-${i + 1}.csv`,
					sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
					status: TaskStatus.COMPLETED,
					funderShortCode: systemFunder.shortCode,
				});
			}, Promise.resolve());

			await request(app)
				.get('/tasks/bulkUploads')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 20,
						entries: [
							{
								id: 15,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'bar-15.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: TaskStatus.COMPLETED,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 14,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'bar-14.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: TaskStatus.COMPLETED,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 13,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'bar-13.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: TaskStatus.COMPLETED,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 12,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'bar-12.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: TaskStatus.COMPLETED,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
							{
								id: 11,
								sourceId: systemSource.id,
								source: systemSource,
								funderShortCode: systemFunder.shortCode,
								funder: systemFunder,
								fileName: 'bar-11.csv',
								fileSize: null,
								sourceKey:
									'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
								status: TaskStatus.COMPLETED,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
						],
					});
				});
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/tasks/bulkUploads/').expect(401);
		});

		it('requires a user', async () => {
			await request(app)
				.post('/tasks/bulkUploads/')
				.set(authHeaderWithNoSub)
				.expect(401);
		});

		it('creates exactly one bulk upload task', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});

			const before = await loadTableMetrics('bulk_upload_tasks');
			const result = await request(app)
				.post('/tasks/bulkUploads/')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					funderShortCode: systemFunder.shortCode,
					fileName: 'foo.csv',
					sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				})
				.expect(201);
			const after = await loadTableMetrics('bulk_upload_tasks');

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				id: expectNumber(),
				sourceId: systemSource.id,
				source: systemSource,
				fileName: 'foo.csv',
				fileSize: null,
				funderShortCode: systemFunder.shortCode,
				funder: systemFunder,
				sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				status: 'pending',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 422 unprocessable entity when the user does not have edit permission for the associated funder', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.VIEW,
			});
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.MANAGE,
			});

			const before = await loadTableMetrics('bulk_upload_tasks');
			const result = await request(app)
				.post('/tasks/bulkUploads/')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					funderShortCode: systemFunder.shortCode,
					fileName: 'foo.csv',
					sourceKey: 'unprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				})
				.expect(422);
			const after = await loadTableMetrics('bulk_upload_tasks');

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You do not have write permissions on a funder with the specified short code.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(0);
		});

		it('returns 400 bad request when no file name is provided', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			const result = await request(app)
				.post('/tasks/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					sourceKey: '96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when an invalid file name is provided', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			const result = await request(app)
				.post('/tasks/bulkUploads')
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
				details: expectArray(),
			});
		});

		it('returns 400 bad request when an invalid source key is provided', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			const result = await request(app)
				.post('/tasks/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					fileName: 'foo.csv',
					sourceKey: 'notUnprocessed/96ddab90-1931-478d-8c02-a1dc80ae01e5-bar',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no source key is provided', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			const result = await request(app)
				.post('/tasks/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					fileName: 'foo.csv',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});
});
