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
import { createTestFile } from '../test/factories';
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
import {
	Permission,
	TaskStatus,
	type WritableBulkUploadTask,
	keycloakIdToString,
} from '../types';

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
			const firstProposalsDataFile = await createTestFile(
				db,
				testUserAuthContext,
			);
			const secondProposalsDataFile = await createTestFile(
				db,
				testUserAuthContext,
			);

			const visibleBulkUpload = await createBulkUploadTask(
				db,
				testUserAuthContext,
				{
					sourceId: systemSource.id,
					proposalsDataFileId: firstProposalsDataFile.id,
					attachmentsArchiveFileId: null,
					status: TaskStatus.PENDING,
					funderShortCode: systemFunder.shortCode,
				},
			);
			await createBulkUploadTask(db, testUserAuthContext, {
				sourceId: systemSource.id,
				proposalsDataFileId: secondProposalsDataFile.id,
				attachmentsArchiveFileId: null,
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
						entries: [visibleBulkUpload],
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
				keycloakUserName: 'Joe',
			});
			const anotherUserAuthContext = getAuthContext(anotherUser);
			const firstProposal = await createTestFile(db, testUserAuthContext);
			const secondProposal = await createTestFile(db, testUserAuthContext);
			const firstBulkUploadTask = await createBulkUploadTask(
				db,
				testUserAuthContext,
				{
					sourceId: systemSource.id,
					proposalsDataFileId: firstProposal.id,
					attachmentsArchiveFileId: null,
					status: TaskStatus.PENDING,
					funderShortCode: systemFunder.shortCode,
				},
			);
			const secondBulkUploadTask = await createBulkUploadTask(
				db,
				anotherUserAuthContext,
				{
					sourceId: systemSource.id,
					proposalsDataFileId: secondProposal.id,
					attachmentsArchiveFileId: null,
					status: TaskStatus.COMPLETED,
					funderShortCode: systemFunder.shortCode,
				},
			);

			await request(app)
				.get('/tasks/bulkUploads')
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 2,
						entries: [secondBulkUploadTask, firstBulkUploadTask],
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
				keycloakUserName: 'Karen',
			});
			const anotherUserAuthContext = getAuthContext(anotherUser);
			const firstProposalsFile = await createTestFile(db, testUserAuthContext);
			const secondProposalsFile = await createTestFile(
				db,
				anotherUserAuthContext,
			);

			await createBulkUploadTask(db, testUserAuthContext, {
				sourceId: systemSource.id,
				proposalsDataFileId: firstProposalsFile.id,
				attachmentsArchiveFileId: null,
				status: TaskStatus.PENDING,
				funderShortCode: systemFunder.shortCode,
			});
			const visibleBulkUploadTask = await createBulkUploadTask(
				db,
				anotherUserAuthContext,
				{
					sourceId: systemSource.id,
					proposalsDataFileId: secondProposalsFile.id,
					attachmentsArchiveFileId: null,
					status: TaskStatus.COMPLETED,
					funderShortCode: systemFunder.shortCode,
				},
			);

			await request(app)
				.get(
					`/tasks/bulkUploads?createdBy=${keycloakIdToString(anotherUser.keycloakUserId)}`,
				)
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						total: 2,
						entries: [visibleBulkUploadTask],
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
				keycloakUserName: 'Larry',
			});
			const anotherUserAuthContext = getAuthContext(anotherUser);
			const firstProposalsFile = await createTestFile(db, testUserAuthContext);
			const secondProposalsFile = await createTestFile(
				db,
				anotherUserAuthContext,
			);
			const visibleBulkUploadTask = await createBulkUploadTask(
				db,
				testUserAuthContext,
				{
					sourceId: systemSource.id,
					proposalsDataFileId: firstProposalsFile.id,
					attachmentsArchiveFileId: null,
					status: TaskStatus.PENDING,
					funderShortCode: systemFunder.shortCode,
				},
			);
			await createBulkUploadTask(db, anotherUserAuthContext, {
				sourceId: systemSource.id,
				proposalsDataFileId: secondProposalsFile.id,
				attachmentsArchiveFileId: null,
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
						entries: [visibleBulkUploadTask],
					});
				});
		});

		it('supports pagination', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const bulkUploadTasks = (
				await Promise.all(
					Array.from(Array(20)).map(async () => {
						const proposalsDataFile = await createTestFile(
							db,
							testUserAuthContext,
						);
						return await createBulkUploadTask(db, testUserAuthContext, {
							sourceId: systemSource.id,
							proposalsDataFileId: proposalsDataFile.id,
							attachmentsArchiveFileId: null,
							status: TaskStatus.COMPLETED,
							funderShortCode: systemFunder.shortCode,
						});
					}),
				)
			).sort((a, b) => a.id - b.id);

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
							bulkUploadTasks[14],
							bulkUploadTasks[13],
							bulkUploadTasks[12],
							bulkUploadTasks[11],
							bulkUploadTasks[10],
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
			const testUserAuthContext = getAuthContext(testUser);
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			const proposalsDataFile = await createTestFile(db, testUserAuthContext);

			const testData: WritableBulkUploadTask = {
				sourceId: systemSource.id,
				funderShortCode: systemFunder.shortCode,
				proposalsDataFileId: proposalsDataFile.id,
				attachmentsArchiveFileId: null,
			};
			const before = await loadTableMetrics('bulk_upload_tasks');
			const result = await request(app)
				.post('/tasks/bulkUploads/')
				.type('application/json')
				.set(authHeader)
				.send(testData)
				.expect(201);
			const after = await loadTableMetrics('bulk_upload_tasks');

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				id: expectNumber(),
				sourceId: systemSource.id,
				source: systemSource,
				funderShortCode: systemFunder.shortCode,
				funder: systemFunder,
				proposalsDataFileId: expectNumber(),
				proposalsDataFile,
				attachmentsArchiveFileId: null,
				attachmentsArchiveFile: null,
				status: 'pending',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(1);
		});

		it('creates a bulk upload task with attachments archive file', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			const proposalsDataFile = await createTestFile(db, testUserAuthContext);
			const attachmentsArchiveFile = await createTestFile(
				db,
				testUserAuthContext,
			);

			const before = await loadTableMetrics('bulk_upload_tasks');
			const result = await request(app)
				.post('/tasks/bulkUploads/')
				.type('application/json')
				.set(authHeader)
				.send({
					sourceId: systemSource.id,
					funderShortCode: systemFunder.shortCode,
					proposalsDataFileId: proposalsDataFile.id,
					attachmentsArchiveFileId: attachmentsArchiveFile.id,
				})
				.expect(201);
			const after = await loadTableMetrics('bulk_upload_tasks');

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				id: expectNumber(),
				sourceId: systemSource.id,
				source: systemSource,
				funderShortCode: systemFunder.shortCode,
				funder: systemFunder,
				proposalsDataFileId: expectNumber(),
				proposalsDataFile,
				attachmentsArchiveFileId: expectNumber(),
				attachmentsArchiveFile,
				status: 'pending',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
				logs: [],
			});
			expect(after.count).toEqual(1);
		});

		it('returns 422 unprocessable entity when the user does not have edit permission for the associated funder', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const proposalsDataFile = await createTestFile(db, testUserAuthContext);
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

			const testData: WritableBulkUploadTask = {
				sourceId: systemSource.id,
				funderShortCode: systemFunder.shortCode,
				proposalsDataFileId: proposalsDataFile.id,
				attachmentsArchiveFileId: null,
			};
			const before = await loadTableMetrics('bulk_upload_tasks');
			const result = await request(app)
				.post('/tasks/bulkUploads/')
				.type('application/json')
				.set(authHeader)
				.send(testData)
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

		it('returns 400 bad request when no proposalDataFileId is provided', async () => {
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

			const testData: Omit<WritableBulkUploadTask, 'proposalsDataFileId'> = {
				sourceId: systemSource.id,
				funderShortCode: systemFunder.shortCode,
				attachmentsArchiveFileId: null,
			};
			const result = await request(app)
				.post('/tasks/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send(testData)
				.expect(400);

			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when an invalid proposalDataFileId is provided', async () => {
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
			const testData: Omit<WritableBulkUploadTask, 'proposalsDataFileId'> & {
				proposalsDataFileId: string;
			} = {
				sourceId: systemSource.id,
				funderShortCode: systemFunder.shortCode,
				proposalsDataFileId: 'not a file id',
				attachmentsArchiveFileId: null,
			};
			const result = await request(app)
				.post('/tasks/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send(testData)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when an invalid proposalDataFileId is provided', async () => {
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
			const testData: Omit<WritableBulkUploadTask, 'proposalsDataFileId'> & {
				proposalsDataFileId: string;
			} = {
				sourceId: systemSource.id,
				funderShortCode: systemFunder.shortCode,
				proposalsDataFileId: 'not a file id',
				attachmentsArchiveFileId: null,
			};
			const result = await request(app)
				.post('/tasks/bulkUploads')
				.type('application/json')
				.set(authHeader)
				.send(testData)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 422 unprocessable entity when user tries to use a file they do not own for proposal data', async () => {
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

			const fileOwnedByAnotherUser = await createTestFile(
				db,
				systemUserAuthContext,
			);

			const testData: WritableBulkUploadTask = {
				sourceId: systemSource.id,
				funderShortCode: systemFunder.shortCode,
				proposalsDataFileId: fileOwnedByAnotherUser.id,
				attachmentsArchiveFileId: null,
			};
			const before = await loadTableMetrics('bulk_upload_tasks');
			const result = await request(app)
				.post('/tasks/bulkUploads/')
				.type('application/json')
				.set(authHeader)
				.send(testData)
				.expect(422);
			const after = await loadTableMetrics('bulk_upload_tasks');

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You must be the owner of the file specified by proposalsDataFileId.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(0);
		});

		it('returns 422 unprocessable entity when the user is not the owner of the attachments archive file', async () => {
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174001',
				keycloakUserName: 'Alice',
			});
			const anotherUserAuthContext = getAuthContext(anotherUser);
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
			});
			const proposalsDataFile = await createTestFile(db, testUserAuthContext);
			const attachmentsArchiveFileOwnedByAnotherUser = await createTestFile(
				db,
				anotherUserAuthContext,
			);

			const testData: WritableBulkUploadTask = {
				sourceId: systemSource.id,
				funderShortCode: systemFunder.shortCode,
				proposalsDataFileId: proposalsDataFile.id,
				attachmentsArchiveFileId: attachmentsArchiveFileOwnedByAnotherUser.id,
			};
			const before = await loadTableMetrics('bulk_upload_tasks');
			const result = await request(app)
				.post('/tasks/bulkUploads/')
				.type('application/json')
				.set(authHeader)
				.send(testData)
				.expect(422);
			const after = await loadTableMetrics('bulk_upload_tasks');

			expect(before.count).toEqual(0);
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You must be the owner of the file specified by attachmentsArchiveFileId.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(0);
		});
	});
});
