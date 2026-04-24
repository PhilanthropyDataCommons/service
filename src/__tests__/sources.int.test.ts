import request from 'supertest';
import { app } from '../app';
import {
	getDatabase,
	createEphemeralUserGroupAssociation,
	createSource,
	loadSystemSource,
	loadTableMetrics,
	loadSystemUser,
	createProposal,
	createProposalVersion,
	createApplicationForm,
	createPermissionGrant,
} from '../database';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	createTestChangemaker,
	createTestDataProvider,
	createTestFunder,
	createTestOpportunity,
} from '../test/factories';
import { getAuthContext, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
	PostgresErrorCode,
	stringToKeycloakId,
} from '../types';
const agent = request.agent(app);

describe('/sources', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/sources').expect(401);
		});

		it('returns all sources for an administrator', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const source = await createSource(db, testUserAuthContext, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});
			const response = await agent
				.get('/sources')
				.set(adminUserAuthHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [source, systemSource],
				total: 2,
			});
		});

		it('returns no sources when the user has no view permission on any source', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			await createSource(db, testUserAuthContext, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});
			await agent.get('/sources').set(authHeader).expect(200, {
				entries: [],
				total: 0,
			});
		});

		it('returns only sources the user has view permission on via a direct grant', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const visibleSource = await createSource(db, testUserAuthContext, {
				label: 'Visible Inc.',
				changemakerId: changemaker.id,
			});
			await createSource(db, testUserAuthContext, {
				label: 'Hidden Inc.',
				changemakerId: changemaker.id,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: visibleSource.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent.get('/sources').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [visibleSource],
				total: 1,
			});
		});

		it('returns sources the user has view permission on via an inherited changemaker grant', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const visibleChangemaker = await createTestChangemaker(
				db,
				testUserAuthContext,
			);
			const hiddenChangemaker = await createTestChangemaker(
				db,
				testUserAuthContext,
			);
			const visibleSource = await createSource(db, testUserAuthContext, {
				label: 'Visible Inc.',
				changemakerId: visibleChangemaker.id,
			});
			await createSource(db, testUserAuthContext, {
				label: 'Hidden Inc.',
				changemakerId: hiddenChangemaker.id,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: visibleChangemaker.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent.get('/sources').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [visibleSource],
				total: 1,
			});
		});

		it('returns sources the user has view permission on via an inherited funder grant', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const visibleFunder = await createTestFunder(db, testUserAuthContext);
			const hiddenFunder = await createTestFunder(db, testUserAuthContext);
			const visibleSource = await createSource(db, testUserAuthContext, {
				label: 'Visible Inc.',
				funderShortCode: visibleFunder.shortCode,
			});
			await createSource(db, testUserAuthContext, {
				label: 'Hidden Inc.',
				funderShortCode: hiddenFunder.shortCode,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent.get('/sources').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [visibleSource],
				total: 1,
			});
		});

		it('returns sources the user has view permission on via an inherited data provider grant', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const visibleDataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);
			const hiddenDataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);
			const visibleSource = await createSource(db, testUserAuthContext, {
				label: 'Visible Inc.',
				dataProviderShortCode: visibleDataProvider.shortCode,
			});
			await createSource(db, testUserAuthContext, {
				label: 'Hidden Inc.',
				dataProviderShortCode: hiddenDataProvider.shortCode,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: visibleDataProvider.shortCode,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent.get('/sources').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [visibleSource],
				total: 1,
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await agent.get('/sources/1').expect(401);
		});

		it('returns the source to an administrator', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const source = await createSource(db, testUserAuthContext, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});

			const response = await agent
				.get(`/sources/${source.id}`)
				.set(adminUserAuthHeader)
				.expect(200);
			expect(response.body).toEqual(source);
		});

		it('returns the source to a user with a direct view grant', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const source = await createSource(db, testUserAuthContext, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: source.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent
				.get(`/sources/${source.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(source);
		});

		it('returns the source to a user with an inherited changemaker view grant', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const source = await createSource(db, testUserAuthContext, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent
				.get(`/sources/${source.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(source);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent.get('/sources/a').set(authHeader).expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await agent
				.get('/sources/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when id is not found', async () => {
			await agent.get('/sources/9001').set(adminUserAuthHeader).expect(404);
		});

		it('returns 404 when the user does not have view permission on the source', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const source = await createSource(db, testUserAuthContext, {
				label: 'Example Inc.',
				changemakerId: changemaker.id,
			});
			await agent.get(`/sources/${source.id}`).set(authHeader).expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/sources').expect(401);
		});

		it('creates and returns exactly one changemaker source for an admin user', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					changemakerId: changemaker.id,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'sources');
			expect(before.count).toEqual(1);
			// Source response includes a shallow changemaker (no fields/fiscalSponsors)
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				changemakerId: changemaker.id,
				changemaker: {
					id: changemaker.id,
					taxId: changemaker.taxId,
					name: changemaker.name,
					keycloakOrganizationId: changemaker.keycloakOrganizationId,
					createdAt: changemaker.createdAt,
				},
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(2);
		});

		it('returns 409 conflict when label is not unique on changemaker foreign key', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			await createSource(db, testUserAuthContext, {
				label: 'Example Corp',
				changemakerId: changemaker.id,
			});
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					changemakerId: changemaker.id,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.UNIQUE_VIOLATION,
					},
				],
			});
		});

		it('returns 409 conflict when label is not unique on data provider foreign key', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const dataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);
			await createSource(db, testUserAuthContext, {
				label: 'Example Corp',
				dataProviderShortCode: dataProvider.shortCode,
			});
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					dataProviderShortCode: dataProvider.shortCode,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.UNIQUE_VIOLATION,
					},
				],
			});
		});

		it('returns 409 conflict when label is not unique on funder foreign key', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			await createSource(db, testUserAuthContext, {
				label: 'Example Corp',
				funderShortCode: funder.shortCode,
			});
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					funderShortCode: funder.shortCode,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.UNIQUE_VIOLATION,
					},
				],
			});
		});

		it('creates and returns exactly one changemaker source for a user with create source permissions on that changemaker', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.CREATE],
			});
			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					changemakerId: changemaker.id,
				});
			expect(result.status).toEqual(201);
			const after = await loadTableMetrics(db, 'sources');
			// Source response includes a shallow changemaker (no fields/fiscalSponsors)
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				changemakerId: changemaker.id,
				changemaker: {
					id: changemaker.id,
					taxId: changemaker.taxId,
					name: changemaker.name,
					keycloakOrganizationId: changemaker.keycloakOrganizationId,
					createdAt: changemaker.createdAt,
				},
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 if the user does not have create source permission on the changemaker', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.CREATE],
			});

			// Also create a userGroup permission grant with CREATE|source but an EXPIRED association
			// to verify that expired associations don't grant access
			const expiredOrgId = 'eeeeeeee-1111-2222-3333-444444444444';
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER_GROUP,
				granteeKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.CREATE],
			});
			await createEphemeralUserGroupAssociation(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				userGroupKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				notAfter: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
			});

			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					changemakerId: changemaker.id,
				})
				.expect(422);
			const after = await loadTableMetrics(db, 'sources');
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You do not have permission to create a source for the specified changemaker.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(before.count);
		});

		it('creates and returns exactly one funder source for an admin user', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					funderShortCode: funder.shortCode,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				funderShortCode: funder.shortCode,
				funder,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(2);
		});

		it('creates and returns exactly one funder source for a user with create source permissions on that funder', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.CREATE],
			});
			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					funderShortCode: funder.shortCode,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'sources');
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				funderShortCode: funder.shortCode,
				funder,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 if the user does not have create source permission on the funder', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.CREATE],
			});

			// Also create a userGroup permission grant with CREATE|source but an EXPIRED association
			// to verify that expired associations don't grant access
			const expiredOrgId = 'ffffffff-1111-2222-3333-444444444444';
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER_GROUP,
				granteeKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.CREATE],
			});
			await createEphemeralUserGroupAssociation(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				userGroupKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				notAfter: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
			});

			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					funderShortCode: funder.shortCode,
				})
				.expect(422);
			const after = await loadTableMetrics(db, 'sources');
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You do not have permission to create a source for the specified funder.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(before.count);
		});

		it('creates and returns exactly one data provider source for an admin user', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const dataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);
			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
					dataProviderShortCode: dataProvider.shortCode,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'sources');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				dataProviderShortCode: dataProvider.shortCode,
				dataProvider,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(2);
		});

		it('creates and returns exactly one data provider source for a user with create source permissions on the data provider', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const dataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: dataProvider.shortCode,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.CREATE],
			});
			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					dataProviderShortCode: dataProvider.shortCode,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'sources');
			expect(result.body).toMatchObject({
				id: 2,
				label: 'Example Corp',
				dataProviderShortCode: dataProvider.shortCode,
				dataProvider,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 if the user does not have create source permission on the data provider', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const dataProvider = await createTestDataProvider(
				db,
				testUserAuthContext,
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: dataProvider.shortCode,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			// Also create a userGroup permission grant with CREATE|source but an EXPIRED association
			// to verify that expired associations don't grant access
			const expiredOrgId = '11111111-aaaa-bbbb-cccc-dddddddddddd';
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER_GROUP,
				granteeKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: dataProvider.shortCode,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.CREATE],
			});
			await createEphemeralUserGroupAssociation(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				userGroupKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				notAfter: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
			});

			const before = await loadTableMetrics(db, 'sources');
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(authHeader)
				.send({
					label: 'Example Corp',
					dataProviderShortCode: dataProvider.shortCode,
				})
				.expect(422);
			const after = await loadTableMetrics(db, 'sources');
			expect(result.body).toEqual({
				details: [{ name: 'UnprocessableEntityError' }],
				message:
					'You do not have permission to create a source for the specified data provider.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(before.count);
		});

		it('returns 400 bad request when no label sent', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					changemakerId: changemaker.id,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no related entity is sent', async () => {
			const result = await agent
				.post('/sources')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					label: 'Example Corp',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});
	describe('DELETE /:sourceId', () => {
		it('requires authentication', async () => {
			await agent.delete('/sources/:sourceId').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.delete('/sources/:sourceId').expect(401);
		});

		it('deletes exactly one source that has no proposals associated with it', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const localSource = await createSource(db, testUserAuthContext, {
				changemakerId: changemaker.id,
				label: 'Example Inc.',
			});
			const before = await loadTableMetrics(db, 'sources');

			await agent
				.delete(`/sources/${localSource.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.expect(200);

			const after = await loadTableMetrics(db, 'sources');

			expect(before.count).toEqual(2);
			expect(after.count).toEqual(1);
		});

		it('Returns 422 Unprocessable Content when it tries to delete a source that is associated with a proposal', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const changemaker = await createTestChangemaker(db, testUserAuthContext);
			const localSource = await createSource(db, testUserAuthContext, {
				changemakerId: changemaker.id,
				label: 'Example Inc.',
			});
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			const proposal = await createProposal(db, systemUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(
				db,
				systemUserAuthContext,
				{
					opportunityId: opportunity.id,
					name: null,
				},
			);
			await createProposalVersion(db, systemUserAuthContext, {
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: localSource.id,
			});
			const before = await loadTableMetrics(db, 'sources');

			await agent
				.delete(`/sources/${localSource.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.expect(422);

			const after = await loadTableMetrics(db, 'sources');

			expect(before.count).toEqual(after.count);
		});
	});
});
