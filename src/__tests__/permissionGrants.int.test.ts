import request from 'supertest';
import { app } from '../app';
import {
	createOrUpdateFunder,
	createSource,
	getDatabase,
	loadTableMetrics,
	removeSource,
} from '../database';
import {
	expectTimestamp,
	expectArray,
	expectNumber,
} from '../test/asymettricMatchers';
import {
	createTestChangemaker,
	createTestFunder,
	createTestPermissionGrant,
} from '../test/factories';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import { getTestAuthContext, getTestUserKeycloakUserId } from '../test/utils';
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

describe('/permissionGrants', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/permissionGrants').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.get('/permissionGrants').set(authHeader).expect(401);
		});

		it('returns an empty list when no permission grants exist', async () => {
			const response = await agent
				.get('/permissionGrants')
				.set(adminUserAuthHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [],
				total: 0,
			});
		});

		it('returns all permission grants for an admin user', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const permissionGrant = await createTestPermissionGrant(db, authContext);

			const response = await agent
				.get('/permissionGrants')
				.set(adminUserAuthHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				entries: [
					{
						id: permissionGrant.id,
						granteeType: 'user',
						granteeUserKeycloakUserId: testUserKeycloakUserId,
						granteeKeycloakOrganizationId: null,
						contextEntityType: 'changemaker',
						changemakerId: expectNumber(),
						scope: ['changemaker'],
						verbs: ['view'],
						createdBy: testUserKeycloakUserId,
						createdAt: expectTimestamp(),
					},
				],
				total: 1,
			});
		});

		it('supports pagination', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			await createTestPermissionGrant(db, authContext);
			const funder = await createTestFunder(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.EDIT],
			});

			await agent
				.get('/permissionGrants?_page=1&_count=1')
				.set(adminUserAuthHeader)
				.expect(200)
				.expect((res) => {
					expect(res.body).toMatchObject({
						entries: [
							{
								id: expectNumber(),
							},
						],
						total: 2,
					});
				});
		});
	});

	describe('GET /:permissionGrantId', () => {
		it('requires authentication', async () => {
			await agent.get('/permissionGrants/1').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.get('/permissionGrants/1').set(authHeader).expect(401);
		});

		it('returns exactly one permission grant by id', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const permissionGrant = await createTestPermissionGrant(db, authContext);

			const response = await agent
				.get(`/permissionGrants/${permissionGrant.id}`)
				.set(adminUserAuthHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				id: permissionGrant.id,
				granteeType: 'user',
				granteeUserKeycloakUserId: testUserKeycloakUserId,
				granteeKeycloakOrganizationId: null,
				contextEntityType: 'changemaker',
				changemakerId: expectNumber(),
				scope: ['changemaker'],
				verbs: ['view'],
				createdBy: testUserKeycloakUserId,
				createdAt: expectTimestamp(),
			});
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent
				.get('/permissionGrants/a')
				.set(adminUserAuthHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await agent
				.get('/permissionGrants/555555555555555555555555555555')
				.set(adminUserAuthHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when id is not found', async () => {
			await agent
				.get('/permissionGrants/9001')
				.set(adminUserAuthHeader)
				.expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/permissionGrants').expect(401);
		});

		it('requires administrator role', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(401);
		});

		it('creates and returns a permission grant for a user', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const before = await loadTableMetrics(db, 'permission_grants');
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view', 'edit'],
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'permission_grants');

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'user',
				granteeUserKeycloakUserId: testUserKeycloakUserId,
				contextEntityType: 'changemaker',
				changemakerId: changemaker.id,
				scope: ['changemaker'],
				verbs: ['view', 'edit'],
				createdBy: testUserKeycloakUserId,
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('creates and returns a permission grant for a user group', async () => {
			const db = getDatabase();
			const userGroupKeycloakId = '47d406ad-5e50-42d4-88f1-f87947a3e314';
			const authContext = await getTestAuthContext(db);
			const funder = await createTestFunder(db, authContext);
			const before = await loadTableMetrics(db, 'permission_grants');
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'userGroup',
					granteeKeycloakOrganizationId: userGroupKeycloakId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['funder'],
					verbs: ['view', 'create'],
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'permission_grants');

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'userGroup',
				granteeKeycloakOrganizationId: userGroupKeycloakId,
				contextEntityType: 'funder',
				funderShortCode: funder.shortCode,
				scope: ['funder'],
				verbs: ['view', 'create'],
				createdBy: testUserKeycloakUserId,
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('creates a permission grant for a user not in the users table', async () => {
			const db = getDatabase();
			const arbitraryUserKeycloakUserId =
				'b4e46c13-0abc-4a7e-9d72-a1b2c3d4e5f6';
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: arbitraryUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(201);

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'user',
				granteeUserKeycloakUserId: arbitraryUserKeycloakUserId,
				contextEntityType: 'changemaker',
				changemakerId: changemaker.id,
				scope: ['changemaker'],
				verbs: ['view'],
				createdBy: testUserKeycloakUserId,
				createdAt: expectTimestamp(),
			});
		});

		it('returns 422 when referenced entity does not exist', async () => {
			await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: 9999,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(422);
		});

		it('returns 400 bad request when granteeType is missing', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when granteeType is invalid', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'invalid',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when granteeUserKeycloakUserId is missing', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when granteeUserKeycloakUserId is not a valid UUID', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: 'not-a-valid-uuid',
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when contextEntityType is missing', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when contextEntityType is invalid', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'invalidEntityType',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when FK field for contextEntityType is missing', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when scope is missing', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when scope is empty', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: [],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when scope contains invalid entity type', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['invalidEntityType'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when scope contains entity type not allowed for context', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['funder'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when scope contains mix of allowed and disallowed types', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker', 'funder'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when verbs is missing', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when verbs is empty', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: [],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when verbs contains invalid verb', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['invalidVerb'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('creates and returns a permission grant with conditions', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const funder = await createOrUpdateFunder(db, authContext, {
				shortCode: 'condFunder',
				name: 'Conditions Test Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['proposalFieldValue'],
					verbs: ['view'],
					conditions: {
						proposalFieldValue: {
							property: 'baseFieldCategory',
							operator: 'in',
							value: ['budget', 'project'],
						},
					},
				})
				.expect(201);

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'user',
				granteeUserKeycloakUserId: testUserKeycloakUserId,
				contextEntityType: 'funder',
				funderShortCode: funder.shortCode,
				scope: ['proposalFieldValue'],
				verbs: ['view'],
				conditions: {
					proposalFieldValue: {
						property: 'baseFieldCategory',
						operator: 'in',
						value: ['budget', 'project'],
					},
				},
				createdBy: testUserKeycloakUserId,
				createdAt: expectTimestamp(),
			});
		});

		it('creates a permission grant with null conditions', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const funder = await createOrUpdateFunder(db, authContext, {
				shortCode: 'nullCondFunder',
				name: 'Null Conditions Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['proposalFieldValue'],
					verbs: ['view'],
					conditions: null,
				})
				.expect(201);

			expect(result.body).toMatchObject({
				conditions: null,
			});
		});

		it('creates a permission grant with in operator condition', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const funder = await createOrUpdateFunder(db, authContext, {
				shortCode: 'eqCondFunder',
				name: 'In Condition Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['proposalFieldValue'],
					verbs: ['view'],
					conditions: {
						proposalFieldValue: {
							property: 'baseFieldCategory',
							operator: 'in',
							value: ['budget'],
						},
					},
				})
				.expect(201);

			expect(result.body).toMatchObject({
				conditions: {
					proposalFieldValue: {
						property: 'baseFieldCategory',
						operator: 'in',
						value: ['budget'],
					},
				},
			});
		});

		it('returns 400 when conditions has invalid property name', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const funder = await createOrUpdateFunder(db, authContext, {
				shortCode: 'badFieldFunder',
				name: 'Bad Field Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['proposalFieldValue'],
					verbs: ['view'],
					conditions: {
						proposalFieldValue: {
							property: 'invalidField',
							operator: 'in',
							value: ['budget'],
						},
					},
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 when conditions has invalid operator', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const funder = await createOrUpdateFunder(db, authContext, {
				shortCode: 'badOpFunder',
				name: 'Bad Op Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['proposalFieldValue'],
					verbs: ['view'],
					conditions: {
						proposalFieldValue: {
							property: 'baseFieldCategory',
							operator: 'notIn',
							value: ['budget'],
						},
					},
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 when condition key is not in scope', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const funder = await createOrUpdateFunder(db, authContext, {
				shortCode: 'noScopeFunder',
				name: 'No Scope Funder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['funder'],
					verbs: ['view'],
					conditions: {
						proposalFieldValue: {
							property: 'baseFieldCategory',
							operator: 'in',
							value: ['budget'],
						},
					},
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
			});
		});
	});

	describe('PUT /:permissionGrantId', () => {
		it('requires authentication', async () => {
			await agent.put('/permissionGrants/1').expect(401);
		});

		it('requires administrator role', async () => {
			await agent
				.put('/permissionGrants/1')
				.type('application/json')
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: 1,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(401);
		});

		it('updates and returns the permission grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const permissionGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view', 'edit'],
				})
				.expect(200);

			expect(response.body).toMatchObject({
				id: permissionGrant.id,
				granteeType: 'user',
				granteeUserKeycloakUserId: testUserKeycloakUserId,
				contextEntityType: 'changemaker',
				changemakerId: changemaker.id,
				scope: ['changemaker'],
				verbs: ['view', 'edit'],
				createdBy: testUserKeycloakUserId,
				createdAt: expectTimestamp(),
			});
		});

		it('updates the context entity of a permission grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const permissionGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const funder = await createTestFunder(db, authContext);

			const response = await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['funder'],
					verbs: ['view'],
				})
				.expect(200);

			expect(response.body).toMatchObject({
				id: permissionGrant.id,
				granteeType: 'user',
				granteeUserKeycloakUserId: testUserKeycloakUserId,
				contextEntityType: 'funder',
				funderShortCode: funder.shortCode,
				scope: ['funder'],
				verbs: ['view'],
			});
		});

		it('updates the grantee of a permission grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const permissionGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const userGroupKeycloakId = '47d406ad-5e50-42d4-88f1-f87947a3e314';

			const response = await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'userGroup',
					granteeKeycloakOrganizationId: userGroupKeycloakId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(200);

			expect(response.body).toMatchObject({
				id: permissionGrant.id,
				granteeType: 'userGroup',
				granteeKeycloakOrganizationId: userGroupKeycloakId,
				contextEntityType: 'changemaker',
				changemakerId: changemaker.id,
				scope: ['changemaker'],
				verbs: ['view'],
			});
		});

		it('updates conditions on a permission grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const funder = await createTestFunder(db, authContext);
			const permissionGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.PROPOSAL_FIELD_VALUE],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'funder',
					funderShortCode: funder.shortCode,
					scope: ['proposalFieldValue'],
					verbs: ['view'],
					conditions: {
						proposalFieldValue: {
							property: 'baseFieldCategory',
							operator: 'in',
							value: ['budget'],
						},
					},
				})
				.expect(200);

			expect(response.body).toMatchObject({
				id: permissionGrant.id,
				conditions: {
					proposalFieldValue: {
						property: 'baseFieldCategory',
						operator: 'in',
						value: ['budget'],
					},
				},
			});
		});

		it('does not create a new row when updating', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const permissionGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const before = await loadTableMetrics(db, 'permission_grants');

			await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view', 'edit'],
				})
				.expect(200);

			const after = await loadTableMetrics(db, 'permission_grants');
			expect(after.count).toEqual(before.count);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent
				.put('/permissionGrants/a')
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
				details: expectArray(),
			});
		});

		it('returns 400 bad request when body is invalid', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const permissionGrant = await createTestPermissionGrant(db, authContext);

			const result = await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'invalid',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when scope is not valid for context entity type', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const permissionGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const result = await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['funder'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
			});
		});

		it('returns 404 when id is not found', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			await agent
				.put('/permissionGrants/9001')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(404);
		});

		it('returns 422 when referenced entity does not exist', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const permissionGrant = await createTestPermissionGrant(db, authContext);

			await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: 9999,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(422);
		});
	});

	describe('DELETE /:permissionGrantId', () => {
		it('requires authentication', async () => {
			await agent.delete('/permissionGrants/1').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.delete('/permissionGrants/1').set(authHeader).expect(401);
		});

		it('deletes exactly one permission grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const permissionGrant = await createTestPermissionGrant(db, authContext);
			const before = await loadTableMetrics(db, 'permission_grants');

			await agent
				.delete(`/permissionGrants/${permissionGrant.id}`)
				.set(adminUserAuthHeader)
				.expect(204);

			const after = await loadTableMetrics(db, 'permission_grants');
			expect(after.count).toEqual(before.count - 1);
		});

		it('cascades deletion when the referenced entity is deleted', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			const source = await createSource(db, authContext, {
				label: 'Cascade Test Source',
				changemakerId: changemaker.id,
			});
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: source.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const before = await loadTableMetrics(db, 'permission_grants');

			await removeSource(db, null, source.id);

			const after = await loadTableMetrics(db, 'permission_grants');
			expect(after.count).toEqual(before.count - 1);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent
				.delete('/permissionGrants/a')
				.set(adminUserAuthHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await agent
				.delete('/permissionGrants/555555555555555555555555555555')
				.set(adminUserAuthHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when id is not found', async () => {
			await agent
				.delete('/permissionGrants/9001')
				.set(adminUserAuthHeader)
				.expect(404);
		});
	});
});
