import request from 'supertest';
import { app } from '../app';
import {
	getDatabase,
	loadDataProvider,
	loadPermissionGrantBundle,
	loadSystemDataProvider,
	loadSystemUser,
	loadTableMetrics,
} from '../database';
import {
	expectArray,
	expectArrayContaining,
	expectObjectContaining,
	expectTimestamp,
} from '../test/asymettricMatchers';
import { createTestDataProvider } from '../test/factories';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	loadTestUser,
	getTestUserKeycloakUserId,
	getAuthContext,
	NO_LIMIT,
	NO_OFFSET,
} from '../test/utils';
const agent = request.agent(app);

describe('/dataProviders', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/dataProviders').expect(401);
		});

		it('returns all data providers present in the database', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);

			const systemDataProvider = await loadSystemDataProvider(db, null);
			const firstDataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);
			const secondDataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);

			const response = await agent
				.get('/dataProviders')
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				entries: [secondDataProvider, firstDataProvider, systemDataProvider],
				total: 3,
			});
		});
	});

	describe('GET /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.get('/dataProviders/foo').expect(401);
		});

		it('returns exactly one data provider selected by short code', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestDataProvider(db, testUserAuthContext);
			const expectedDataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);

			const response = await agent
				.get(`/dataProviders/${expectedDataProvider.shortCode}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual(expectedDataProvider);
		});

		it('returns 404 when short code is not found', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestDataProvider(db, testUserAuthContext);
			await agent.get('/dataProviders/nonexistent').set(authHeader).expect(404);
		});
	});

	describe('PUT /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.put('/dataProviders/foo').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.put('/dataProviders/foo').set(authHeader).expect(401);
		});

		it('creates and returns exactly one data provider', async () => {
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'data_providers');
			const result = await agent
				.put('/dataProviders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(201);
			const after = await loadTableMetrics(db, 'data_providers');
			expect(result.body).toStrictEqual({
				shortCode: 'firework',
				name: '🎆',
				createdAt: expectTimestamp(),
				createdBy: getTestUserKeycloakUserId(),
				keycloakOrganizationId: null,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('allows all alphanumeric, _, and - in the short name', async () => {
			await agent
				.put('/dataProviders/Firework_-foo42')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(201);
		});

		it('updates an existing data provider and no others', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);

			const targetDataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
				{
					name: 'Original Name',
				},
			);
			const otherDataProviderBefore = await createTestDataProvider(
				db,
				testUserAuthContext,
			);
			const before = await loadTableMetrics(db, 'data_providers');
			const result = await agent
				.put(`/dataProviders/${targetDataProvider.shortCode}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					name: '🎆',
					keycloakOrganizationId: '8b0163ac-bd91-11ef-8579-9fa8ab9f4b7d',
				})
				.expect(200);
			const otherDataProviderAfter = await loadDataProvider(
				db,
				null,
				otherDataProviderBefore.shortCode,
			);
			const after = await loadTableMetrics(db, 'data_providers');
			expect(result.body).toStrictEqual({
				shortCode: targetDataProvider.shortCode,
				name: '🎆',
				keycloakOrganizationId: '8b0163ac-bd91-11ef-8579-9fa8ab9f4b7d',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(before.count);
			expect(otherDataProviderAfter).toEqual(otherDataProviderBefore);
		});

		it('returns 201 on first PUT and 200 on subsequent PUT to the same shortCode', async () => {
			await agent
				.put('/dataProviders/repeatable')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: 'first' })
				.expect(201);
			const second = await agent
				.put('/dataProviders/repeatable')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: 'second' })
				.expect(200);
			expect(second.body).toMatchObject({
				shortCode: 'repeatable',
				name: 'second',
			});
		});

		it('grants the creator a manage permission on the new data provider', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			await agent
				.put('/dataProviders/self_grant_dp')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: 'Self-grant DP' })
				.expect(201);
			const grants = await loadPermissionGrantBundle(
				db,
				getAuthContext(systemUser, true),
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				NO_LIMIT,
				NO_OFFSET,
			);
			expect(grants.entries).toEqual(
				expectArrayContaining([
					expectObjectContaining({
						granteeType: 'user',
						granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
						contextEntityType: 'dataProvider',
						dataProviderShortCode: 'self_grant_dp',
						scope: ['any'],
						verbs: ['manage'],
					}),
				]),
			);
		});

		it('does not grant a permission when the PUT updates an existing data provider', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const existing = await createTestDataProvider(db, testUserAuthContext);
			const before = await loadPermissionGrantBundle(
				db,
				systemUserAuthContext,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				NO_LIMIT,
				NO_OFFSET,
			);
			await agent
				.put(`/dataProviders/${existing.shortCode}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: 'Renamed' })
				.expect(200);
			const after = await loadPermissionGrantBundle(
				db,
				systemUserAuthContext,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				NO_LIMIT,
				NO_OFFSET,
			);
			expect(after.total).toEqual(before.total);
		});

		it('returns 400 bad request when no name is sent', async () => {
			const result = await agent
				.put('/dataProviders/foo')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ noTitleHere: '👎' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when disallowed characters are included in the short code', async () => {
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'data_providers');
			await agent
				.put('/dataProviders/my provider')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(400);
			const after = await loadTableMetrics(db, 'data_providers');
			expect(after.count).toEqual(before.count);
		});
	});
});
