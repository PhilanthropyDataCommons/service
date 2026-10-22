import nock from 'nock';
import {
	createOrUpdateUser,
	createUserSyncTask,
	getDatabase,
	loadSystemUser,
	loadUserByKeycloakUserId,
	loadUserSyncTask,
	syncUsersFromKeycloak as syncUsersFromKeycloakOperation,
	updateUserSyncTask,
} from '../../database';
import { getMockJobHelpers } from '../../test/mockGraphileWorker';
import { KEYCLOAK_USERS_LIST_PAGE_SIZE } from '../../keycloak/constants';
import { createTestUser } from '../../test/factories';
import { getTestAuthContext } from '../../test/utils';
import { InputConflictError } from '../../errors';
import { issuer } from '../../auth/jwtOptions';
import { syncUsersFromKeycloak } from '../syncUsersFromKeycloak';
import {
	keycloakIdToString,
	stringToKeycloakId,
	TaskStatus,
} from '../../types';
import type { KeycloakUserRepresentation } from '../../keycloak';
import type { TinyPg } from 'tinypg';

const keycloakAdminBaseUrl = issuer.replace('/realms/', '/admin/realms/');
const AUTHORIZATION_HEADER = 'Bearer some.test.jwt';

const FIRST_USER_KEYCLOAK_ID = '11111111-2222-4111-8111-111111111111';
const SECOND_USER_KEYCLOAK_ID = '22222222-3333-4222-8222-222222222222';
const THIRD_USER_KEYCLOAK_ID = '33333333-4444-4333-8333-333333333333';

const getCreatePendingUserSyncTask = async (db: TinyPg) =>
	await createUserSyncTask(db, await getTestAuthContext(db), {
		status: TaskStatus.PENDING,
	});

const mockKeycloakUsers = (users: KeycloakUserRepresentation[]) =>
	nock(keycloakAdminBaseUrl)
		.get('/users')
		.query({
			briefRepresentation: 'true',
			exact: 'false',
			first: '0',
			max: String(KEYCLOAK_USERS_LIST_PAGE_SIZE),
		})
		.matchHeader('authorization', AUTHORIZATION_HEADER)
		.reply(200, users);

const getRunUserSyncTask = async (
	db: TinyPg,
	userSyncTaskId: number,
	users: KeycloakUserRepresentation[],
) => {
	const request = mockKeycloakUsers(users);
	await syncUsersFromKeycloak(
		{
			userSyncTaskId,
			keycloakAdminAuthorizationHeader: AUTHORIZATION_HEADER,
		},
		getMockJobHelpers(),
	);
	return request;
};

describe('syncUsersFromKeycloak', () => {
	it('merges the Keycloak users and marks absent users disabled', async () => {
		const db = getDatabase();
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(FIRST_USER_KEYCLOAK_ID),
			keycloakUserName: 'Fernando',
		});
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
			keycloakUserName: 'Greta',
		});
		const userSyncTask = await getCreatePendingUserSyncTask(db);

		await getRunUserSyncTask(db, userSyncTask.id, [
			{
				id: stringToKeycloakId(FIRST_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Fernando',
				lastName: 'Updated',
			},
			{
				id: stringToKeycloakId(THIRD_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Hikari',
			},
		]);

		const completedTask = await loadUserSyncTask(db, null, userSyncTask.id);
		expect(completedTask.status).toBe(TaskStatus.COMPLETED);
		expect(completedTask.details).toEqual({
			users: { seen: 2, added: 1, updated: 1, disabled: 2 },
		});
		// The task code, not a database trigger, maintains statusUpdatedAt.
		expect(completedTask.statusUpdatedAt).not.toBe(
			userSyncTask.statusUpdatedAt,
		);

		const firstUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(FIRST_USER_KEYCLOAK_ID),
		);
		expect(firstUser.keycloakUserName).toBe('Fernando Updated');
		expect(firstUser.syncedFromKeycloakAt).not.toBeNull();
		expect(firstUser.disabledAt).toBeNull();

		const secondUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(secondUser.disabledAt).not.toBeNull();

		const thirdUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(THIRD_USER_KEYCLOAK_ID),
		);
		expect(thirdUser.keycloakUserName).toBe('Hikari');
		expect(thirdUser.disabledAt).toBeNull();

		const systemUser = await loadSystemUser(db, null);
		expect(systemUser.disabledAt).toBeNull();
	});

	it('merges a user that appears on two paginated pages only once', async () => {
		const db = getDatabase();
		const userSyncTask = await getCreatePendingUserSyncTask(db);

		await getRunUserSyncTask(db, userSyncTask.id, [
			{
				id: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Greta',
			},
			{
				id: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Greta',
			},
		]);

		const completedTask = await loadUserSyncTask(db, null, userSyncTask.id);
		expect(completedTask.status).toBe(TaskStatus.COMPLETED);
		expect(completedTask.details).toEqual({
			users: { seen: 1, added: 1, updated: 0, disabled: 1 },
		});
	});

	it('keeps the cached name when the brief payload omits names', async () => {
		const db = getDatabase();
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
			keycloakUserName: 'Greta',
		});
		const userSyncTask = await getCreatePendingUserSyncTask(db);

		await getRunUserSyncTask(db, userSyncTask.id, [
			{
				id: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				enabled: true,
			},
		]);

		const user = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(user.keycloakUserName).toBe('Greta');
	});

	it('marks a user live again when the user reappears in Keycloak', async () => {
		const db = getDatabase();
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
			keycloakUserName: 'Greta',
		});
		const userSyncTask = await getCreatePendingUserSyncTask(db);

		// A listing without Greta still disables the absent one.
		await getRunUserSyncTask(db, userSyncTask.id, [
			{
				id: stringToKeycloakId(THIRD_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Hikari',
			},
		]);
		const disabledUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(disabledUser.disabledAt).not.toBeNull();

		const secondSyncTask = await getCreatePendingUserSyncTask(db);
		await getRunUserSyncTask(db, secondSyncTask.id, [
			{
				id: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Greta',
			},
		]);
		const revivedUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(revivedUser.disabledAt).toBeNull();
	});

	it('marks a user disabled when Keycloak reports the user as not enabled', async () => {
		const db = getDatabase();
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
			keycloakUserName: 'Greta',
		});
		const userSyncTask = await getCreatePendingUserSyncTask(db);

		await getRunUserSyncTask(db, userSyncTask.id, [
			{
				id: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				enabled: false,
				firstName: 'Greta',
			},
		]);
		const disabledUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(disabledUser.disabledAt).not.toBeNull();

		const secondSyncTask = await getCreatePendingUserSyncTask(db);
		await getRunUserSyncTask(db, secondSyncTask.id, [
			{
				id: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Greta',
			},
		]);
		const enabledAgainUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(enabledAgainUser.disabledAt).toBeNull();
	});

	it('marks the task FAILED when Keycloak rejects the listing', async () => {
		const db = getDatabase();
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(FIRST_USER_KEYCLOAK_ID),
			keycloakUserName: 'Fernando',
		});
		const userSyncTask = await getCreatePendingUserSyncTask(db);

		nock(keycloakAdminBaseUrl)
			.get('/users')
			.query(true)
			.reply(500, { error: 'boom' });
		await syncUsersFromKeycloak(
			{
				userSyncTaskId: userSyncTask.id,
				keycloakAdminAuthorizationHeader: AUTHORIZATION_HEADER,
			},
			getMockJobHelpers(),
		);

		const failedTask = await loadUserSyncTask(db, null, userSyncTask.id);
		expect(failedTask.status).toBe(TaskStatus.FAILED);
		expect(failedTask.details).toBeNull();

		const untouchedUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(FIRST_USER_KEYCLOAK_ID),
		);
		expect(untouchedUser.syncedFromKeycloakAt).toBeNull();
	});

	it('leaves a non-pending task alone', async () => {
		const db = getDatabase();
		const userSyncTask = await getCreatePendingUserSyncTask(db);
		await updateUserSyncTask(
			db,
			null,
			{ status: TaskStatus.COMPLETED },
			userSyncTask.id,
		);

		const request = await getRunUserSyncTask(db, userSyncTask.id, []);

		expect(request.isDone()).toBe(false);
		const untouchedTask = await loadUserSyncTask(db, null, userSyncTask.id);
		expect(untouchedTask.status).toBe(TaskStatus.COMPLETED);
	});

	it('marks a user live again when the user logs in with a valid JWT', async () => {
		const db = getDatabase();
		await createOrUpdateUser(db, null, {
			keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
			keycloakUserName: 'Greta',
		});
		const userSyncTask = await getCreatePendingUserSyncTask(db);

		// A listing without Greta still disables the absent one.
		await getRunUserSyncTask(db, userSyncTask.id, [
			{
				id: stringToKeycloakId(THIRD_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Hikari',
			},
		]);
		const disabledUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(disabledUser.disabledAt).not.toBeNull();

		// Simulate the login: a valid JWT issued after the disable is
		// evidence the account is live again, so the upsert clears it.
		await createOrUpdateUser(
			db,
			null,
			{
				keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				keycloakUserName: 'Greta',
			},
			new Date().toISOString(),
		);
		const revivedUser = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(revivedUser.disabledAt).toBeNull();
		expect(keycloakIdToString(revivedUser.keycloakUserId)).toBe(
			SECOND_USER_KEYCLOAK_ID,
		);
	});

	it('skips disabling users when the listing sees no users', async () => {
		const db = getDatabase();
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
			keycloakUserName: 'Greta',
		});
		const userSyncTask = await getCreatePendingUserSyncTask(db);

		await getRunUserSyncTask(db, userSyncTask.id, []);

		const completedTask = await loadUserSyncTask(db, null, userSyncTask.id);
		expect(completedTask.status).toBe(TaskStatus.COMPLETED);
		expect(completedTask.details).toEqual({
			users: { seen: 0, added: 0, updated: 0, disabled: 0 },
		});
		const user = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(user.disabledAt).toBeNull();
	});

	it('fails a sync run that overlaps a run holding the sync lock', async () => {
		const db = getDatabase();
		const request = mockKeycloakUsers([
			{
				id: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Greta',
			},
		]);
		await db.transaction(async (transactionDb) => {
			await transactionDb.query(
				`SELECT pg_advisory_xact_lock(hashtext('user_sync_tasks'))`,
			);
			await expect(
				syncUsersFromKeycloakOperation(db, null, AUTHORIZATION_HEADER),
			).rejects.toThrow(InputConflictError);
		});
		// The listing is lock-guarded: it must not start while the lock is held.
		expect(request.isDone()).toBe(false);
	});

	it('purges exhausted sync job rows from the worker schema', async () => {
		const db = getDatabase();
		const userSyncTask = await getCreatePendingUserSyncTask(db);
		const { rows: taskRows } = await db.query<{ id: number }>(
			`INSERT INTO graphile_worker._private_tasks (identifier)
			VALUES ('syncUsersFromKeycloak')
			ON CONFLICT (identifier) DO UPDATE SET identifier = EXCLUDED.identifier
			RETURNING id`,
			{ identifier: 'syncUsersFromKeycloak' },
		);
		const workerTaskId = taskRows[0]?.id;
		const jobPayload = JSON.stringify({
			userSyncTaskId: userSyncTask.id,
			keycloakAdminAuthorizationHeader: AUTHORIZATION_HEADER,
		});
		await db.query(
			`INSERT INTO graphile_worker._private_jobs (task_id, payload, attempts, max_attempts)
			VALUES (:workerTaskId, :jobPayload::json, 1, 1)`,
			{ workerTaskId, jobPayload },
		);
		await db.query(
			`INSERT INTO graphile_worker._private_jobs (task_id, payload, attempts, max_attempts)
			VALUES (:workerTaskId, :jobPayload::json, 0, 1)`,
			{ workerTaskId, jobPayload },
		);

		await getRunUserSyncTask(db, userSyncTask.id, []);

		const { rows: remainingJobs } = await db.query<{ attempts: number }>(
			`SELECT attempts
			FROM graphile_worker._private_jobs
			WHERE task_id = :workerTaskId
			ORDER BY attempts`,
			{ workerTaskId },
		);
		expect(remainingJobs).toEqual([{ attempts: 0 }]);
	});

	it('marks abandoned user sync tasks as failed on the next run', async () => {
		const db = getDatabase();
		const abandonedTask = await getCreatePendingUserSyncTask(db);
		await updateUserSyncTask(
			db,
			null,
			{
				status: TaskStatus.IN_PROGRESS,
				statusUpdatedAt: new Date().toISOString(),
			},
			abandonedTask.id,
		);
		const currentTask = await getCreatePendingUserSyncTask(db);

		await getRunUserSyncTask(db, currentTask.id, []);

		const reconciledTask = await loadUserSyncTask(db, null, abandonedTask.id);
		expect(reconciledTask.status).toBe(TaskStatus.FAILED);
		const currentTaskAfter = await loadUserSyncTask(db, null, currentTask.id);
		expect(currentTaskAfter.status).toBe(TaskStatus.COMPLETED);
	});

	it('audits changes to user_sync_tasks without the details column', async () => {
		const db = getDatabase();
		const userSyncTask = await getCreatePendingUserSyncTask(db);
		await getRunUserSyncTask(db, userSyncTask.id, []);

		const { rows } = await db.query<{
			action: string;
			row_data: Record<string, unknown> | null;
			changed_fields: Record<string, unknown> | null;
		}>(
			`SELECT action, row_data, changed_fields
			FROM audit_logs
			WHERE table_name = 'user_sync_tasks'
			ORDER BY event_id`,
		);

		const insertRows = rows.filter((row) => row.action === 'I');
		const updateRows = rows.filter((row) => row.action === 'U');
		expect(insertRows.length).toBeGreaterThan(0);
		expect(updateRows.length).toBeGreaterThan(0);
		for (const row of [...insertRows, ...updateRows]) {
			expect(row.row_data).not.toHaveProperty('details');
			expect(row.changed_fields ?? {}).not.toHaveProperty('details');
		}
		expect(insertRows[0]?.row_data).toHaveProperty('status', 'pending');
		expect(updateRows[0]?.changed_fields).toHaveProperty('status');
	});

	it('completes when a first authenticated request inserts the same user concurrently', async () => {
		const db = getDatabase();
		const userSyncTask = await getCreatePendingUserSyncTask(db);
		// Neither path has seen the user yet: the sync listing carries them and a
		// first authenticated request upserts them at the same time.
		const listedUsers = [
			{
				id: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Greta',
			},
		];
		const [syncOutcome, jwtOutcome] = await Promise.allSettled([
			getRunUserSyncTask(db, userSyncTask.id, listedUsers),
			createOrUpdateUser(
				db,
				null,
				{
					keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
					keycloakUserName: 'Greta',
				},
				new Date().toISOString(),
			),
		]);

		// Both insertion paths must survive the insert race.
		expect(syncOutcome.status).toBe('fulfilled');
		expect(jwtOutcome.status).toBe('fulfilled');
		const user = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(user.keycloakUserName).toBe('Greta');
		expect(user.disabledAt).toBeNull();
	});

	it('records the disable time when the disable is applied, not when the listing began', async () => {
		const db = getDatabase();
		const testUser = await createTestUser(db, null);
		const userSyncTask = await getCreatePendingUserSyncTask(db);
		// The listing takes a second; a token issued at listing start predates
		// the disable application and must not be able to clear it.
		const listingStartedAt = new Date();
		const request = nock(keycloakAdminBaseUrl)
			.get('/users')
			.query({
				briefRepresentation: 'true',
				exact: 'false',
				first: '0',
				max: String(KEYCLOAK_USERS_LIST_PAGE_SIZE),
			})
			.matchHeader('authorization', AUTHORIZATION_HEADER)
			.delay(1000)
			.reply(200, [
				{
					id: stringToKeycloakId(THIRD_USER_KEYCLOAK_ID),
					enabled: true,
					firstName: 'Hikari',
				},
			]);
		await syncUsersFromKeycloak(
			{
				userSyncTaskId: userSyncTask.id,
				keycloakAdminAuthorizationHeader: AUTHORIZATION_HEADER,
			},
			getMockJobHelpers(),
		);
		expect(request.isDone()).toBe(true);

		const disabledUser = await loadUserByKeycloakUserId(
			db,
			null,
			testUser.keycloakUserId,
		);
		const disabledAt = disabledUser.disabledAt ?? '';
		expect(disabledAt).not.toBe('');
		expect(new Date(disabledAt).getTime()).toBeGreaterThan(
			listingStartedAt.getTime() + 900,
		);
	});

	it('imports service accounts alongside regular users', async () => {
		const db = getDatabase();
		const serviceAccountKeycloakId = '55555555-6666-4555-8555-555555555555';
		const userSyncTask = await getCreatePendingUserSyncTask(db);
		// A service account has no name attributes; exact=false keeps it in
		// the listing so it is neither disabled nor left uncached.
		await getRunUserSyncTask(db, userSyncTask.id, [
			{
				id: stringToKeycloakId(serviceAccountKeycloakId),
				enabled: true,
			},
		]);

		const serviceAccount = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(serviceAccountKeycloakId),
		);
		expect(serviceAccount.disabledAt).toBeNull();
		expect(serviceAccount.syncedFromKeycloakAt).not.toBeNull();
	});

	it('does not let a token issued during a re-enable clear the latest re-disable', async () => {
		const db = getDatabase();
		await createTestUser(db, null, {
			keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
			keycloakUserName: 'Greta',
		});
		// Sync #1: Greta is absent from the listing and is disabled at T1.
		const firstSyncTask = await getCreatePendingUserSyncTask(db);
		await getRunUserSyncTask(db, firstSyncTask.id, [
			{
				id: stringToKeycloakId(THIRD_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Hikari',
			},
		]);
		const disabledOnce = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(disabledOnce.disabledAt).not.toBeNull();

		// Greta is re-enabled in Keycloak and receives a JWT at T2, without
		// contacting PDC, and is then disabled again before sync #2 (T3).
		const tokenIssuedDuringReEnable = new Date().toISOString();
		const secondSyncTask = await getCreatePendingUserSyncTask(db);
		await getRunUserSyncTask(db, secondSyncTask.id, [
			{
				id: stringToKeycloakId(THIRD_USER_KEYCLOAK_ID),
				enabled: true,
				firstName: 'Hikari',
			},
		]);

		// The login's upsert carries the T2 token: it must not clear the
		// newer T3 observation.
		await createOrUpdateUser(
			db,
			null,
			{
				keycloakUserId: stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
				keycloakUserName: 'Greta',
			},
			tokenIssuedDuringReEnable,
		);
		const userAfterLogin = await loadUserByKeycloakUserId(
			db,
			null,
			stringToKeycloakId(SECOND_USER_KEYCLOAK_ID),
		);
		expect(userAfterLogin.disabledAt).not.toBeNull();
	});
});
