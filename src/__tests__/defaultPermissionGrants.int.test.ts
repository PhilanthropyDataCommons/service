import request from 'supertest';
import { app } from '../app';
import { getDatabase, loadTableMetrics } from '../database';
import { expectNumber, expectTimestamp } from '../test/asymettricMatchers';
import { createTestDefaultPermissionGrant } from '../test/factories';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	getTestAuthContext,
	getTestUserKeycloakUserId,
	loadTestUser,
} from '../test/utils';
import {
	nonNullKeycloakIdToString,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';
const agent = request.agent(app);

const testUserKeycloakUserId = nonNullKeycloakIdToString(
	getTestUserKeycloakUserId(),
);
const testUserGroupKeycloakOrganizationId =
	'47d406ad-5e50-42d4-88f1-f87947a3e314';

describe('/defaultPermissionGrants', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/defaultPermissionGrants').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.get('/defaultPermissionGrants').set(authHeader).expect(401);
		});

		it('returns an empty list when no default permission grants exist', async () => {
			const response = await agent
				.get('/defaultPermissionGrants')
				.set(adminUserAuthHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [],
				total: 0,
			});
		});

		it('returns all default permission grants', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const defaultPermissionGrant = await createTestDefaultPermissionGrant(
				db,
				authContext,
			);
			const expectedCreatedByUser = await loadTestUser(db);

			const response = await agent
				.get('/defaultPermissionGrants')
				.set(adminUserAuthHeader)
				.expect(200);

			expect(response.body).toEqual({
				entries: [
					{
						id: defaultPermissionGrant.id,
						granteeType: 'user',
						granteeUserKeycloakUserId: testUserKeycloakUserId,
						granteeKeycloakOrganizationId: null,
						contextEntityType: 'changemaker',
						scope: ['changemaker'],
						verbs: ['view'],
						conditions: null,
						createdBy: testUserKeycloakUserId,
						createdByUser: expectedCreatedByUser,
						createdAt: expectTimestamp(),
					},
				],
				total: 1,
			});
		});

		it('supports pagination', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			await createTestDefaultPermissionGrant(db, authContext);
			await createTestDefaultPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.FUNDER,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.EDIT],
			});

			const response = await agent
				.get('/defaultPermissionGrants?_page=1&_count=1')
				.set(adminUserAuthHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				entries: [
					{
						contextEntityType: 'funder',
					},
				],
				total: 2,
			});
		});
	});

	describe('GET /:defaultPermissionGrantId', () => {
		it('requires authentication', async () => {
			await agent.get('/defaultPermissionGrants/1').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.get('/defaultPermissionGrants/1').set(authHeader).expect(401);
		});

		it('returns 404 when the default permission grant does not exist', async () => {
			await agent
				.get('/defaultPermissionGrants/9001')
				.set(adminUserAuthHeader)
				.expect(404);
		});

		it('returns 400 bad request when id is a letter', async () => {
			await agent
				.get('/defaultPermissionGrants/a')
				.set(adminUserAuthHeader)
				.expect(400);
		});

		it('returns the default permission grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const defaultPermissionGrant = await createTestDefaultPermissionGrant(
				db,
				authContext,
			);

			const response = await agent
				.get(`/defaultPermissionGrants/${defaultPermissionGrant.id}`)
				.set(adminUserAuthHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				id: defaultPermissionGrant.id,
				granteeType: 'user',
				granteeUserKeycloakUserId: testUserKeycloakUserId,
				contextEntityType: 'changemaker',
				scope: ['changemaker'],
				verbs: ['view'],
			});
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/defaultPermissionGrants').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.post('/defaultPermissionGrants').set(authHeader).expect(401);
		});

		it('creates and returns a default permission grant for a user', async () => {
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'default_permission_grants');
			const result = await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					scope: ['changemaker'],
					verbs: ['view', 'edit'],
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'default_permission_grants');
			const expectedCreatedByUser = await loadTestUser(db);

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'user',
				granteeUserKeycloakUserId: testUserKeycloakUserId,
				granteeKeycloakOrganizationId: null,
				contextEntityType: 'changemaker',
				scope: ['changemaker'],
				verbs: ['view', 'edit'],
				createdBy: testUserKeycloakUserId,
				createdByUser: expectedCreatedByUser,
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('creates and returns a default permission grant for a user group', async () => {
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'default_permission_grants');
			const result = await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'userGroup',
					granteeKeycloakOrganizationId: testUserGroupKeycloakOrganizationId,
					contextEntityType: 'funder',
					scope: ['funder'],
					verbs: ['view', 'create'],
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'default_permission_grants');

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'userGroup',
				granteeUserKeycloakUserId: null,
				granteeKeycloakOrganizationId: testUserGroupKeycloakOrganizationId,
				contextEntityType: 'funder',
				scope: ['funder'],
				verbs: ['view', 'create'],
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('creates and returns a default permission grant for all authenticated users', async () => {
			const result = await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'authenticatedUsers',
					contextEntityType: 'changemaker',
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(201);

			expect(result.body).toMatchObject({
				granteeType: 'authenticatedUsers',
				granteeUserKeycloakUserId: null,
				granteeKeycloakOrganizationId: null,
			});
		});

		it('creates and returns a default permission grant with conditions', async () => {
			const result = await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					scope: ['proposalFieldValue'],
					verbs: ['view'],
					conditions: {
						proposalFieldValue: {
							property: 'baseFieldCategory',
							operator: 'in',
							value: ['project'],
						},
					},
				})
				.expect(201);

			expect(result.body).toMatchObject({
				conditions: {
					proposalFieldValue: {
						property: 'baseFieldCategory',
						operator: 'in',
						value: ['project'],
					},
				},
			});
		});

		it('returns 400 bad request when the context entity key is included', async () => {
			const result = await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);

			expect(result.body).toMatchObject({
				name: 'InputValidationError',
			});
		});

		it('returns 400 bad request when contextEntityType is missing', async () => {
			await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
		});

		it('returns 400 bad request when contextEntityType is `any`', async () => {
			await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'any',
					scope: ['any'],
					verbs: ['view'],
				})
				.expect(400);
		});

		it('returns 400 bad request when granteeUserKeycloakUserId is missing', async () => {
			await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					contextEntityType: 'changemaker',
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
		});

		it('returns 400 bad request when scope is not allowed for the context entity type', async () => {
			await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					scope: ['opportunity'],
					verbs: ['view'],
				})
				.expect(400);
		});

		it('returns 400 bad request when verbs is empty', async () => {
			await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					scope: ['changemaker'],
					verbs: [],
				})
				.expect(400);
		});

		it('returns 400 bad request when a condition key is not in scope', async () => {
			await agent
				.post('/defaultPermissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					scope: ['changemaker'],
					verbs: ['view'],
					conditions: {
						proposalFieldValue: {
							property: 'baseFieldCategory',
							operator: 'in',
							value: ['project'],
						},
					},
				})
				.expect(400);
		});
	});

	describe('PUT /:defaultPermissionGrantId', () => {
		it('requires authentication', async () => {
			await agent.put('/defaultPermissionGrants/1').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.put('/defaultPermissionGrants/1').set(authHeader).expect(401);
		});

		it('returns 404 when the default permission grant does not exist', async () => {
			await agent
				.put('/defaultPermissionGrants/9001')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(404);
		});

		it('updates and returns the default permission grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const defaultPermissionGrant = await createTestDefaultPermissionGrant(
				db,
				authContext,
			);

			const result = await agent
				.put(`/defaultPermissionGrants/${defaultPermissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'userGroup',
					granteeKeycloakOrganizationId: testUserGroupKeycloakOrganizationId,
					contextEntityType: 'funder',
					scope: ['funder', 'opportunity'],
					verbs: ['view', 'edit'],
				})
				.expect(200);

			expect(result.body).toMatchObject({
				id: defaultPermissionGrant.id,
				granteeType: 'userGroup',
				granteeUserKeycloakUserId: null,
				granteeKeycloakOrganizationId: testUserGroupKeycloakOrganizationId,
				contextEntityType: 'funder',
				scope: ['funder', 'opportunity'],
				verbs: ['view', 'edit'],
			});
		});

		it('returns 400 bad request when the context entity key is included', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const defaultPermissionGrant = await createTestDefaultPermissionGrant(
				db,
				authContext,
			);

			await agent
				.put(`/defaultPermissionGrants/${defaultPermissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
		});
	});

	describe('DELETE /:defaultPermissionGrantId', () => {
		it('requires authentication', async () => {
			await agent.delete('/defaultPermissionGrants/1').expect(401);
		});

		it('requires administrator role', async () => {
			await agent
				.delete('/defaultPermissionGrants/1')
				.set(authHeader)
				.expect(401);
		});

		it('returns 404 when the default permission grant does not exist', async () => {
			await agent
				.delete('/defaultPermissionGrants/9001')
				.set(adminUserAuthHeader)
				.expect(404);
		});

		it('deletes exactly one default permission grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const defaultPermissionGrant = await createTestDefaultPermissionGrant(
				db,
				authContext,
			);
			const before = await loadTableMetrics(db, 'default_permission_grants');

			await agent
				.delete(`/defaultPermissionGrants/${defaultPermissionGrant.id}`)
				.set(adminUserAuthHeader)
				.expect(204);

			const after = await loadTableMetrics(db, 'default_permission_grants');
			expect(after.count).toEqual(before.count - 1);
		});
	});
});
