import request from 'supertest';
import { app } from '../app';
import {
	getDatabase,
	createOrganizationSyncTask,
	createPermissionGrant,
	loadSystemUser,
} from '../database';
import {
	expectArray,
	expectNumber,
	expectString,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	createTestChangemaker,
	createTestDataProvider,
	createTestFunder,
	createTestOrganization,
	createTestUser,
} from '../test/factories';
import {
	getMockJwt,
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
	mockJwtWithRealmManagementSyncOrganizationsRoles as authHeaderWithSyncOrganizationsRoles,
	mockJwtWithRealmManagementViewOrganizationsRole as authHeaderWithViewOrganizationsRole,
	mockJwtWithRealmManagementViewUsersRole as authHeaderWithViewUsersRole,
	mockJwtWithUnrelatedRealmManagementRole as authHeaderWithUnrelatedRealmManagementRole,
	mockOrgId,
} from '../test/mockJwt';
import {
	keycloakIdToString,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
	stringToKeycloakId,
	TaskStatus,
} from '../types';
import {
	getAuthContext,
	getTestAuthContext,
	loadTestUser,
} from '../test/utils';
const agent = request.agent(app);

describe('/organizations', () => {
	describe('GET /:keycloakOrganizationId', () => {
		it('requires authentication', async () => {
			await agent
				.get('/organizations/58710347-18ec-4600-b9d9-a06c28c3304a')
				.expect(401);
		});

		it('returns changemaker, data provider, and funder selected by keycloak org id for admins', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const keycloakOrganizationId = stringToKeycloakId(
				'bde830f0-d590-467a-8431-cdf9d6af1b87',
			);

			// Unlinked entities (should not be returned)
			await createTestChangemaker(db, testUserAuthContext);
			await createTestDataProvider(db, testUserAuthContext);
			await createTestFunder(db, testUserAuthContext);

			// Expected entities (linked to target keycloakOrganizationId)
			const expectedChangemaker = await createTestChangemaker(
				db,
				testUserAuthContext,
				{
					keycloakOrganizationId,
				},
			);
			const expectedDataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
				{
					keycloakOrganizationId,
				},
			);
			const expectedFunder = await createTestFunder(db, testUserAuthContext, {
				keycloakOrganizationId,
			});

			// Decoy entities (linked to different keycloakOrganizationIds)
			await createTestChangemaker(db, testUserAuthContext, {
				keycloakOrganizationId: 'fa32e21e-e471-4d28-b101-7788c611aa04',
			});
			await createTestDataProvider(db, testUserAuthContext, {
				keycloakOrganizationId: '865cb652-a1d2-418a-8c89-015c0d6e4676',
			});
			await createTestFunder(db, testUserAuthContext, {
				keycloakOrganizationId: '75b4198f-dd88-4a6c-8259-fe4d725af125',
			});

			const response = await agent
				.get(`/organizations/${keycloakIdToString(keycloakOrganizationId)}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toStrictEqual({
				changemaker: {
					taxId: expectedChangemaker.taxId,
					name: expectedChangemaker.name,
					createdAt: expectTimestamp(),
					createdBy: testUser.keycloakUserId,
					id: expectedChangemaker.id,
					keycloakOrganizationId,
				},
				dataProvider: expectedDataProvider,
				funder: expectedFunder,
				keycloakOrganizationId,
				keycloakOrganizationName: null,
				disabledAt: null,
				members: null,
				formerMembers: null,
			});
		});

		it('returns only the funder on which I have view permission', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const keycloakOrganizationId = 'b5465297-d63a-4371-8054-f94d95f1aace';

			await createTestFunder(db, systemUserAuthContext, {
				name: 'Unlinked funder one.',
				shortCode: 'unlinkedfunderone',
			});
			const expectedFunder = await createTestFunder(db, systemUserAuthContext, {
				name: 'Funderdome',
				shortCode: 'funderdome',
				keycloakOrganizationId,
			});
			const authContext = await getTestAuthContext(db, false);
			// Grant myself view access to this organization
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: authContext.user.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: expectedFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const keycloakOrganizationIdLackingPerm =
				'75b4198f-dd88-4a6c-8259-fe4d725af125';
			await createTestFunder(db, systemUserAuthContext, {
				name: 'Decoy funder, unexpected because I lack view access to this org',
				shortCode: 'decoyfunderunexpected',
				keycloakOrganizationId: keycloakOrganizationIdLackingPerm,
			});

			// I have view access to this org
			const response = await agent
				.get(`/organizations/${keycloakOrganizationId}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				changemaker: null,
				dataProvider: null,
				funder: expectedFunder,
				keycloakOrganizationId,
				keycloakOrganizationName: null,
				disabledAt: null,
				members: null,
				formerMembers: null,
			});
			await agent
				.get(`/organizations/${keycloakOrganizationIdLackingPerm}`)
				.set(authHeader)
				.expect(404);
		});

		it('returns only the data provider on which my org has view permission', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const keycloakOrganizationId = stringToKeycloakId(mockOrgId);

			await createTestDataProvider(db, systemUserAuthContext, {
				name: 'Unlinked Data Provider one.',
				shortCode: 'unlinkeddataproviderone',
			});
			const expectedDataProvider = await createTestDataProvider(
				db,
				systemUserAuthContext,
				{
					name: 'Dapper Data Provider',
					shortCode: 'dapperdataprovider',
					keycloakOrganizationId,
				},
			);
			// Grant my organization of which I'm a member view access to this data provider
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER_GROUP,
				granteeKeycloakOrganizationId: keycloakOrganizationId,
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: expectedDataProvider.shortCode,
				scope: [PermissionGrantEntityType.DATA_PROVIDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const keycloakOrganizationIdLackingPerm =
				'24fea6aa-f1c5-4594-8bdc-b1789d4d0840';
			await createTestDataProvider(db, systemUserAuthContext, {
				name: 'Decoy Data Provider, unexpected because I lack view access to this org',
				shortCode: 'decoydataproviderunexpected',
				keycloakOrganizationId: keycloakOrganizationIdLackingPerm,
			});

			// I have view access to this org via my own org being granted view access
			const response = await agent
				.get(`/organizations/${keycloakIdToString(keycloakOrganizationId)}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				changemaker: null,
				dataProvider: expectedDataProvider,
				funder: null,
				keycloakOrganizationId,
				keycloakOrganizationName: null,
				disabledAt: null,
				members: null,
				formerMembers: null,
			});
			// But I lack view access to this org
			await agent
				.get(`/organizations/${keycloakOrganizationIdLackingPerm}`)
				.set(authHeader)
				.expect(404);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent
				.get('/organizations/a')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when id is not found', async () => {
			await agent
				.get('/organizations/34643bb4-8a4e-46f3-be1a-b679876a506a')
				.set(authHeader)
				.expect(404);
		});

		it('returns members and former members as users for administrators', async () => {
			const db = getDatabase();
			const expectedOrganization = await createTestOrganization(db, {
				keycloakOrganizationId: 'b1c0ffee-0000-4000-8000-000000000001',
				keycloakOrganizationName: 'Memberdome',
			});
			const member = await createTestUser(db, null, {
				keycloakUserName: 'Moe Member',
			});
			const formerMember = await createTestUser(db, null, {
				keycloakUserName: 'Nora Former',
			});
			await db.query(
				'INSERT INTO user_organization_memberships (user_keycloak_user_id, organization_keycloak_id, synced_from_keycloak_at) VALUES (:userKeycloakUserId, :organizationKeycloakId, :syncedFromKeycloakAt);',
				{
					userKeycloakUserId: member.keycloakUserId,
					organizationKeycloakId: expectedOrganization.keycloakOrganizationId,
					syncedFromKeycloakAt: '2000-01-01T00:00:00Z',
				},
			);
			await db.query(
				'INSERT INTO user_organization_memberships (user_keycloak_user_id, organization_keycloak_id, synced_from_keycloak_at, disabled_at) VALUES (:userKeycloakUserId, :organizationKeycloakId, :syncedFromKeycloakAt, :disabledAt);',
				{
					userKeycloakUserId: formerMember.keycloakUserId,
					organizationKeycloakId: expectedOrganization.keycloakOrganizationId,
					syncedFromKeycloakAt: '2000-01-01T00:00:00Z',
					disabledAt: '2001-01-01T00:00:00Z',
				},
			);

			const response = await agent
				.get(`/organizations/${expectedOrganization.keycloakOrganizationId}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toStrictEqual({
				changemaker: null,
				dataProvider: null,
				funder: null,
				keycloakOrganizationId: expectedOrganization.keycloakOrganizationId,
				keycloakOrganizationName: 'Memberdome',
				disabledAt: null,
				members: [
					{
						keycloakUserId: member.keycloakUserId,
						keycloakUserName: 'Moe Member',
						createdAt: expectTimestamp(),
						syncedFromKeycloakAt: null,
						disabledAt: null,
					},
				],
				formerMembers: [
					{
						keycloakUserId: formerMember.keycloakUserId,
						keycloakUserName: 'Nora Former',
						createdAt: expectTimestamp(),
						syncedFromKeycloakAt: null,
						disabledAt: null,
					},
				],
			});
		});

		it('hides cached members from callers holding only view-organizations and shows them when the caller also holds view-users', async () => {
			const db = getDatabase();
			const expectedOrganization = await createTestOrganization(db, {
				keycloakOrganizationId: 'b1c0ffee-0000-4000-8000-000000000002',
				keycloakOrganizationName: 'Visibilitydome',
			});
			const member = await createTestUser(db, null, {
				keycloakUserName: 'Ollie Viewer',
			});
			await db.query(
				'INSERT INTO user_organization_memberships (user_keycloak_user_id, organization_keycloak_id, synced_from_keycloak_at) VALUES (:userKeycloakUserId, :organizationKeycloakId, :syncedFromKeycloakAt);',
				{
					userKeycloakUserId: member.keycloakUserId,
					organizationKeycloakId: expectedOrganization.keycloakOrganizationId,
					syncedFromKeycloakAt: '2000-01-01T00:00:00Z',
				},
			);

			const byIdResponse = await agent
				.get(`/organizations/${expectedOrganization.keycloakOrganizationId}`)
				.set(authHeaderWithViewOrganizationsRole)
				.expect(200);
			expect(byIdResponse.body).toStrictEqual({
				changemaker: null,
				dataProvider: null,
				funder: null,
				keycloakOrganizationId: expectedOrganization.keycloakOrganizationId,
				keycloakOrganizationName: 'Visibilitydome',
				disabledAt: null,
				members: null,
				formerMembers: null,
			});

			const listResponse = await agent
				.get('/organizations')
				.set(authHeaderWithViewOrganizationsRole)
				.expect(200);
			expect(listResponse.body).toStrictEqual({
				entries: [
					{
						changemaker: null,
						dataProvider: null,
						funder: null,
						keycloakOrganizationId: expectedOrganization.keycloakOrganizationId,
						keycloakOrganizationName: 'Visibilitydome',
						disabledAt: null,
						members: null,
						formerMembers: null,
					},
				],
				total: 1,
			});

			const expectedMember = {
				keycloakUserId: member.keycloakUserId,
				keycloakUserName: 'Ollie Viewer',
				createdAt: expectTimestamp(),
				syncedFromKeycloakAt: null,
				disabledAt: null,
			};

			const shownByIdResponse = await agent
				.get(`/organizations/${expectedOrganization.keycloakOrganizationId}`)
				.set(authHeaderWithSyncOrganizationsRoles)
				.expect(200);
			expect(shownByIdResponse.body).toStrictEqual({
				changemaker: null,
				dataProvider: null,
				funder: null,
				keycloakOrganizationId: expectedOrganization.keycloakOrganizationId,
				keycloakOrganizationName: 'Visibilitydome',
				disabledAt: null,
				members: [expectedMember],
				formerMembers: [],
			});

			const shownListResponse = await agent
				.get('/organizations')
				.set(authHeaderWithSyncOrganizationsRoles)
				.expect(200);
			expect(shownListResponse.body).toStrictEqual({
				entries: [
					{
						changemaker: null,
						dataProvider: null,
						funder: null,
						keycloakOrganizationId: expectedOrganization.keycloakOrganizationId,
						keycloakOrganizationName: 'Visibilitydome',
						disabledAt: null,
						members: [expectedMember],
						formerMembers: [],
					},
				],
				total: 1,
			});
		});
	});

	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/organizations').expect(401);
		});

		it('returns an empty bundle for callers without organization visibility', async () => {
			const db = getDatabase();
			await createTestOrganization(db);
			const response = await agent
				.get('/organizations')
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({ entries: [], total: 0 });
		});

		it('returns organizations for administrators', async () => {
			const db = getDatabase();
			const expectedOrganization = await createTestOrganization(db, {
				keycloakOrganizationId: 'a829eda6-3e09-4f79-a47a-379f3d1c0011',
				keycloakOrganizationName: 'Funderdome',
				createdAt: '2024-01-01T00:00:00Z',
			});
			const otherOrganization = await createTestOrganization(db, {
				createdAt: '4024-01-01T00:00:00Z',
			});
			const response = await agent
				.get('/organizations')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toStrictEqual({
				entries: [
					{
						changemaker: null,
						dataProvider: null,
						funder: null,
						keycloakOrganizationId: otherOrganization.keycloakOrganizationId,
						keycloakOrganizationName:
							otherOrganization.keycloakOrganizationName,
						disabledAt: null,
						members: [],
						formerMembers: [],
					},
					{
						changemaker: null,
						dataProvider: null,
						funder: null,
						keycloakOrganizationId: expectedOrganization.keycloakOrganizationId,
						keycloakOrganizationName: 'Funderdome',
						disabledAt: null,
						members: [],
						formerMembers: [],
					},
				],
				total: 2,
			});
		});

		it('paginates organizations', async () => {
			const db = getDatabase();
			await createTestOrganization(db, {
				keycloakOrganizationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
				createdAt: '4024-01-01T00:00:00Z',
			});
			const secondOrganization = await createTestOrganization(db, {
				keycloakOrganizationId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
				createdAt: '4024-01-01T00:00:00Z',
			});
			const response = await agent
				.get('/organizations?_page=1&_count=1')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toStrictEqual({
				entries: [
					{
						changemaker: null,
						dataProvider: null,
						funder: null,
						keycloakOrganizationId: secondOrganization.keycloakOrganizationId,
						keycloakOrganizationName:
							secondOrganization.keycloakOrganizationName,
						disabledAt: null,
						members: [],
						formerMembers: [],
					},
				],
				total: 2,
			});
		});
	});

	describe('POST /organizations/sync', () => {
		it('requires authentication', async () => {
			await agent.post('/organizations/sync').expect(401);
		});

		it('returns 403 when the caller carries no realm-management roles', async () => {
			await agent.post('/organizations/sync').set(authHeader).expect(403);
		});

		it('returns 403 when the caller carries only an unrelated realm-management role', async () => {
			await agent
				.post('/organizations/sync')
				.set(authHeaderWithUnrelatedRealmManagementRole)
				.expect(403);
		});

		it('returns 403 when the caller carries only an organization role without a user role', async () => {
			await agent
				.post('/organizations/sync')
				.set(authHeaderWithViewOrganizationsRole)
				.expect(403);
		});

		it('returns 403 when the caller carries only a user role without an organization role', async () => {
			await agent
				.post('/organizations/sync')
				.set(authHeaderWithViewUsersRole)
				.expect(403);
		});

		it('creates a pending organization sync task when the caller carries sufficient roles', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);

			const response = await agent
				.post('/organizations/sync')
				.set(authHeaderWithSyncOrganizationsRoles)
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

		it('enqueues the sync job atomically with the task row', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);

			await agent
				.post('/organizations/sync')
				.set(authHeaderWithSyncOrganizationsRoles)
				.expect(201);

			const { rows: jobRows } = await db.query<{
				attempts: number;
				maxAttempts: number;
				queueName: string;
				createdBy: string;
				status: string;
			}>(
				`SELECT
					jobs.attempts AS attempts,
					jobs.max_attempts AS "maxAttempts",
					queues.queue_name AS "queueName",
					task.created_by AS "createdBy",
					task.status AS status
				FROM graphile_worker._private_jobs AS jobs
				JOIN graphile_worker._private_job_queues AS queues ON queues.id = jobs.job_queue_id
				JOIN graphile_worker._private_tasks AS tasks ON tasks.id = jobs.task_id
				JOIN organization_sync_tasks AS task ON task.id::text = jobs.payload ->> 'organizationSyncTaskId'
				WHERE tasks.identifier = 'syncOrganizationsFromKeycloak'`,
			);
			expect(jobRows).toEqual([
				{
					attempts: 0,
					maxAttempts: 1,
					queueName: 'sync_users_or_orgs_from_keycloak',
					createdBy: keycloakIdToString(testUser.keycloakUserId),
					status: 'pending',
				},
			]);
		});
	});

	describe('GET /organizations/sync/:organizationSyncTaskId', () => {
		it('requires authentication', async () => {
			await agent.get('/organizations/sync/1').expect(401);
		});

		it('returns 400 when the organizationSyncTaskId is not a valid id', async () => {
			await agent
				.get('/organizations/sync/notanumber')
				.set(authHeaderWithSyncOrganizationsRoles)
				.expect(400);
		});

		it('returns the task for the requester', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const organizationSyncTask = await createOrganizationSyncTask(
				db,
				await getTestAuthContext(db),
				{ status: TaskStatus.PENDING },
			);

			const response = await agent
				.get(`/organizations/sync/${organizationSyncTask.id}`)
				.set(authHeaderWithSyncOrganizationsRoles)
				.expect(200);
			expect(response.body).toEqual({
				id: organizationSyncTask.id,
				status: 'pending',
				statusUpdatedAt: expectTimestamp(),
				details: null,
				createdAt: expectTimestamp(),
				createdBy: keycloakIdToString(testUser.keycloakUserId),
			} satisfies Record<string, unknown>);
		});

		it('returns 404 for a task requested by a different, non-administrator caller', async () => {
			const db = getDatabase();
			const organizationSyncTask = await createOrganizationSyncTask(
				db,
				await getTestAuthContext(db),
				{ status: TaskStatus.PENDING },
			);
			const authHeaderForAnotherUser = getMockJwt({
				sub: '22222222-2222-4222-8222-222222222222',
			});

			await agent
				.get(`/organizations/sync/${organizationSyncTask.id}`)
				.set(authHeaderForAnotherUser)
				.expect(404);
		});

		it('returns the task for an administrator', async () => {
			const db = getDatabase();
			const organizationSyncTask = await createOrganizationSyncTask(
				db,
				await getTestAuthContext(db),
				{ status: TaskStatus.PENDING },
			);
			const authHeaderForAnotherAdministrator = getMockJwt({
				sub: '33333333-3333-4333-8333-333333333333',
				roles: ['pdc-admin'],
			});

			const response = await agent
				.get(`/organizations/sync/${organizationSyncTask.id}`)
				.set(authHeaderForAnotherAdministrator)
				.expect(200);
			expect(response.body).toEqual({
				id: organizationSyncTask.id,
				status: 'pending',
				statusUpdatedAt: expectTimestamp(),
				details: null,
				createdAt: expectTimestamp(),
				createdBy: expectString(),
			} satisfies Record<string, unknown>);
		});
	});
});
