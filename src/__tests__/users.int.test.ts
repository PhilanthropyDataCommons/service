import request from 'supertest';
import { app } from '../app';
import {
	createUserSyncTask,
	getDatabase,
	loadSystemUser,
	loadTableMetrics,
} from '../database';
import { failAbandonedUserSyncTasks } from '../tasks/syncUsersFromKeycloak';
import { getMockJobHelpers } from '../test/mockGraphileWorker';
import {
	getMockJwt,
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
	mockJwtWithRealmManagementManageUsersRole as authHeaderWithManageUsersRole,
	mockJwtWithRealmManagementQueryUsersRole as authHeaderWithQueryUsersRole,
	mockJwtWithRealmManagementViewUsersRole as authHeaderWithViewUsersRole,
	mockJwtWithUnrelatedRealmManagementRole as authHeaderWithUnrelatedRealmManagementRole,
} from '../test/mockJwt';
import { getTestAuthContext, loadTestUser } from '../test/utils';
import { createTestUser } from '../test/factories';
import {
	expectNumber,
	expectString,
	expectTimestamp,
} from '../test/asymettricMatchers';
import { keycloakIdToString, TaskStatus } from '../types';
import type { User } from '../types';
describe('/users', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/users').expect(401);
		});

		it('returns the user associated with the requesting user', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			await createTestUser(db, null);

			const response = await request(app)
				.get('/users')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						...testUser,
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns all users when the caller carries the pdc-admin realm role but no realm-management user role', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const anotherUser = await createTestUser(db, null);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns all users when the caller carries the query-users realm-management role', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const anotherUser = await createTestUser(db, null);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithQueryUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns all users when the caller carries the view-users realm-management role', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const anotherUser = await createTestUser(db, null);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithViewUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns all users when the caller carries the manage-users realm-management role', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const anotherUser = await createTestUser(db, null);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithManageUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns a specific user when a keycloakUserId is provided', async () => {
			const db = getDatabase();
			const anotherUser = await createTestUser(db, null);

			const response = await request(app)
				.get(
					`/users?keycloakUserId=${keycloakIdToString(anotherUser.keycloakUserId)}`,
				)
				.set(authHeaderWithQueryUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [anotherUser],
			});
		});

		it('returns 400 when an invalid keycloakUserId is provided', async () => {
			await request(app)
				.get(`/users?keycloakUserId=thisisnotauuid`)
				.set(authHeaderWithQueryUsersRole)
				.expect(400);
		});

		it('returns according to pagination parameters', async () => {
			const db = getDatabase();
			const createdUsers = await Array.from(Array(20)).reduce<Promise<User[]>>(
				async (p) => {
					const acc = await p;
					const user = await createTestUser(db, null);
					return [...acc, user];
				},
				Promise.resolve([]),
			);
			const { count: userCount } = await loadTableMetrics(db, 'users');

			const response = await request(app)
				.get('/users')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeaderWithQueryUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [
					createdUsers[14],
					createdUsers[13],
					createdUsers[12],
					createdUsers[11],
					createdUsers[10],
				],
			});
		});
	});
	describe('POST /users/sync', () => {
		it('requires authentication', async () => {
			await request(app).post('/users/sync').expect(401);
		});

		it('returns 403 when the caller carries no realm-management user roles', async () => {
			await request(app).post('/users/sync').set(authHeader).expect(403);
		});

		it('returns 403 when the caller carries only an unrelated realm-management role', async () => {
			await request(app)
				.post('/users/sync')
				.set(authHeaderWithUnrelatedRealmManagementRole)
				.expect(403);
		});

		it('returns 403 when the caller carries only the query-users realm-management role', async () => {
			// query-users alone cannot see the whole realm, so absence is not evidence of deletion.
			await request(app)
				.post('/users/sync')
				.set(authHeaderWithQueryUsersRole)
				.expect(403);
		});

		it('creates a pending user sync task when the caller carries the view-users realm-management role', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);

			const response = await request(app)
				.post('/users/sync')
				.set(authHeaderWithViewUsersRole)
				.expect(201);
			expect(response.body).toEqual({
				id: expectNumber(),
				status: 'pending',
				statusUpdatedAt: expectTimestamp(),
				details: null,
				createdAt: expectTimestamp(),
				createdBy: keycloakIdToString(testUser.keycloakUserId),
			} satisfies Record<string, unknown>);
		});

		it('creates a pending user sync task when the caller carries the view-users realm-management role', async () => {
			await request(app)
				.post('/users/sync')
				.set(authHeaderWithViewUsersRole)
				.expect(201);
		});

		it('creates a pending user sync task when the caller carries the manage-users realm-management role', async () => {
			await request(app)
				.post('/users/sync')
				.set(authHeaderWithManageUsersRole)
				.expect(201);
		});

		it('enqueues the sync job atomically with the task row', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);

			await request(app)
				.post('/users/sync')
				.set(authHeaderWithViewUsersRole)
				.expect(201);

			// The task row and its job commit together: the job is visible as
			// soon as the task is, joined back through the payload.
			const { rows: jobRows } = await db.query<{
				attempts: number;
				maxAttempts: number;
				createdBy: string;
				status: string;
			}>(
				`SELECT
					jobs.attempts AS attempts,
					jobs.max_attempts AS "maxAttempts",
					task.created_by AS "createdBy",
					task.status AS status
				FROM graphile_worker._private_jobs AS jobs
				JOIN graphile_worker._private_tasks AS tasks ON tasks.id = jobs.task_id
				JOIN user_sync_tasks AS task ON task.id::text = jobs.payload ->> 'userSyncTaskId'
				WHERE tasks.identifier = 'syncUsersFromKeycloak'`,
			);
			expect(jobRows).toEqual([
				{
					attempts: 0,
					maxAttempts: 1,
					createdBy: keycloakIdToString(testUser.keycloakUserId),
					status: 'pending',
				},
			]);
		});

		it('keeps a submitted sync task pending when reconciliation runs', async () => {
			const db = getDatabase();
			await request(app)
				.post('/users/sync')
				.set(authHeaderWithViewUsersRole)
				.expect(201);
			const { rows: submittedRows } = await db.query<{ id: number }>(
				`SELECT id FROM user_sync_tasks WHERE status = 'pending'`,
			);
			const [submittedRow] = submittedRows;
			if (submittedRow === undefined) {
				throw new Error('The submitted task row was not found.');
			}

			// Reconciliation marks jobless task rows failed, but the submitted
			// task has a live job row (committed atomically) and stays pending.
			await createUserSyncTask(db, await getTestAuthContext(db), {
				status: TaskStatus.PENDING,
			});
			await failAbandonedUserSyncTasks(
				db,
				submittedRow.id,
				getMockJobHelpers().logger,
			);

			const { rows: pendingRows } = await db.query<{ status: string }>(
				`SELECT status FROM user_sync_tasks WHERE status = 'pending'`,
			);
			expect(pendingRows).toEqual([{ status: 'pending' }]);
			const { rows: failedRows } = await db.query<{ status: string }>(
				`SELECT status FROM user_sync_tasks WHERE status = 'failed'`,
			);
			expect(failedRows).toEqual([{ status: 'failed' }]);
		});
	});

	describe('GET /users/sync/:userSyncTaskId', () => {
		it('requires authentication', async () => {
			await request(app).get('/users/sync/1').expect(401);
		});

		it('returns 400 when the userSyncTaskId is not a valid id', async () => {
			await request(app)
				.get('/users/sync/notanumber')
				.set(authHeaderWithQueryUsersRole)
				.expect(400);
		});

		it('returns the task for the requester', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const userSyncTask = await createUserSyncTask(
				db,
				await getTestAuthContext(db),
				{ status: TaskStatus.PENDING },
			);

			const response = await request(app)
				.get(`/users/sync/${userSyncTask.id}`)
				.set(authHeaderWithQueryUsersRole)
				.expect(200);
			expect(response.body).toEqual({
				id: userSyncTask.id,
				status: 'pending',
				statusUpdatedAt: expectTimestamp(),
				details: null,
				createdAt: expectTimestamp(),
				createdBy: keycloakIdToString(testUser.keycloakUserId),
			} satisfies Record<string, unknown>);
		});

		it('returns 404 for a task requested by a different, non-administrator caller', async () => {
			const db = getDatabase();
			const userSyncTask = await createUserSyncTask(
				db,
				await getTestAuthContext(db),
				{ status: TaskStatus.PENDING },
			);
			const authHeaderForAnotherUser = getMockJwt({
				sub: '22222222-2222-4222-8222-222222222222',
			});

			await request(app)
				.get(`/users/sync/${userSyncTask.id}`)
				.set(authHeaderForAnotherUser)
				.expect(404);
		});

		it('returns the task for an administrator', async () => {
			const db = getDatabase();
			const userSyncTask = await createUserSyncTask(
				db,
				await getTestAuthContext(db),
				{ status: TaskStatus.PENDING },
			);
			const authHeaderForAnotherAdministrator = getMockJwt({
				sub: '33333333-3333-4333-8333-333333333333',
				roles: ['pdc-admin'],
			});

			const response = await request(app)
				.get(`/users/sync/${userSyncTask.id}`)
				.set(authHeaderForAnotherAdministrator)
				.expect(200);
			expect(response.body).toEqual({
				id: userSyncTask.id,
				status: 'pending',
				statusUpdatedAt: expectTimestamp(),
				details: null,
				createdAt: expectTimestamp(),
				createdBy: expectString(),
			} satisfies Record<string, unknown>);
		});
	});
});
