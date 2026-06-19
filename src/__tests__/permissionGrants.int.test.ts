import request from 'supertest';
import { app } from '../app';
import {
	createApplicationForm,
	createPermissionGrant,
	getDatabase,
	hasApplicationFormPermission,
	hasChangemakerPermission,
	hasDataProviderPermission,
	hasFunderPermission,
	hasOpportunityPermission,
	hasProposalPermission,
	hasSourcePermission,
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
	createTestDataProvider,
	createTestFunder,
	createTestOpportunity,
	createTestPermissionGrant,
	createTestProposal,
	createTestSource,
} from '../test/factories';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	getAuthContext,
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

describe('/permissionGrants', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/permissionGrants').expect(401);
		});

		it('returns an empty list for a non-admin without any manage permissions', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			await createTestPermissionGrant(db, authContext);

			const response = await agent
				.get('/permissionGrants')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [],
				total: 0,
			});
		});

		it('returns only grants whose context entity the non-admin can manage', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const manageableChangemaker = await createTestChangemaker(
				db,
				authContext,
			);
			const unmanageableChangemaker = await createTestChangemaker(
				db,
				authContext,
			);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: manageableChangemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.MANAGE],
			});
			const visibleGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: manageableChangemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: unmanageableChangemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent
				.get('/permissionGrants')
				.set(authHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				total: 2,
				entries: [
					expect.objectContaining({
						id: visibleGrant.id,
						changemakerId: manageableChangemaker.id,
					}),
					expect.objectContaining({
						changemakerId: manageableChangemaker.id,
						verbs: ['manage'],
					}),
				],
			});
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
			const expectedCreatedByUser = await loadTestUser(db);

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

		it('returns 404 to a non-admin without manage permission on the context entity', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const permissionGrant = await createTestPermissionGrant(db, authContext);
			await agent
				.get(`/permissionGrants/${permissionGrant.id}`)
				.set(authHeader)
				.expect(404);
		});

		it('allows non-admin with manage permission on the context entity', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.MANAGE],
			});
			const targetGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await agent
				.get(`/permissionGrants/${targetGrant.id}`)
				.set(authHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				id: targetGrant.id,
				contextEntityType: 'changemaker',
				changemakerId: changemaker.id,
			});
		});

		it('returns exactly one permission grant by id', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const permissionGrant = await createTestPermissionGrant(db, authContext);
			const expectedCreatedByUser = await loadTestUser(db);

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
				createdByUser: expectedCreatedByUser,
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

		it('returns 403 to a non-admin who has no permission on the context entity', async () => {
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
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(403);
		});

		it('returns 403 to a non-admin with view but not manage permission on the context entity', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(403);
		});

		it.each([
			[PermissionGrantEntityType.CHANGEMAKER, 'changemakerId', 9001],
			[PermissionGrantEntityType.FUNDER, 'funderShortCode', 'foo'],
			[PermissionGrantEntityType.DATA_PROVIDER, 'dataProviderShortCode', 'foo'],
			[PermissionGrantEntityType.OPPORTUNITY, 'opportunityId', 9001],
			[PermissionGrantEntityType.PROPOSAL, 'proposalId', 9001],
			[PermissionGrantEntityType.PROPOSAL_VERSION, 'proposalVersionId', 9001],
			[PermissionGrantEntityType.APPLICATION_FORM, 'applicationFormId', 9001],
			[
				PermissionGrantEntityType.APPLICATION_FORM_FIELD,
				'applicationFormFieldId',
				9001,
			],
			[
				PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
				'proposalFieldValueId',
				9001,
			],
			[PermissionGrantEntityType.SOURCE, 'sourceId', 9001],
			[PermissionGrantEntityType.BULK_UPLOAD, 'bulkUploadTaskId', 9001],
			[
				PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
				'changemakerFieldValueId',
				9001,
			],
		] as Array<[PermissionGrantEntityType, string, number | string]>)(
			'returns 404 to a non-admin when the %s context entity does not exist',
			async (contextEntityType, keyName, keyValue) => {
				const result = await agent
					.post('/permissionGrants')
					.type('application/json')
					.set(authHeader)
					.send({
						granteeType: 'user',
						granteeUserKeycloakUserId: testUserKeycloakUserId,
						contextEntityType,
						[keyName]: keyValue,
						scope: [contextEntityType],
						verbs: ['view'],
					})
					.expect(404);
				expect(result.body).toMatchObject({
					name: 'NotFoundError',
				});
			},
		);

		it.each([
			[PermissionGrantEntityType.FUNDER, 'funderShortCode', createTestFunder],
			[
				PermissionGrantEntityType.DATA_PROVIDER,
				'dataProviderShortCode',
				createTestDataProvider,
			],
		] as const)(
			'returns 403 to a non-admin who can view but not manage an existing %s context entity',
			async (contextEntityType, keyName, createTestEntity) => {
				const db = getDatabase();
				const authContext = await getTestAuthContext(db);
				const entity = await createTestEntity(db, authContext);
				await agent
					.post('/permissionGrants')
					.type('application/json')
					.set(authHeader)
					.send({
						granteeType: 'user',
						granteeUserKeycloakUserId: testUserKeycloakUserId,
						contextEntityType,
						[keyName]: entity.shortCode,
						scope: [contextEntityType],
						verbs: ['view'],
					})
					.expect(403);
			},
		);

		it('returns 403 to a non-admin who can view but not manage an existing opportunity context entity', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const opportunity = await createTestOpportunity(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: opportunity.id,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'opportunity',
					opportunityId: opportunity.id,
					scope: ['opportunity'],
					verbs: ['view'],
				})
				.expect(403);
		});

		it('returns 403 to a non-admin who can view but not manage an existing proposal context entity', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const proposal = await createTestProposal(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.PROPOSAL,
				proposalId: proposal.id,
				scope: [PermissionGrantEntityType.PROPOSAL],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'proposal',
					proposalId: proposal.id,
					scope: ['proposal'],
					verbs: ['view'],
				})
				.expect(403);
		});

		it('returns 403 to a non-admin who can view but not manage an existing source context entity', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const source = await createTestSource(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.SOURCE,
				sourceId: source.id,
				scope: [PermissionGrantEntityType.SOURCE],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'source',
					sourceId: source.id,
					scope: ['source'],
					verbs: ['view'],
				})
				.expect(403);
		});

		it('allows non-admin with manage permission to create a grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.MANAGE],
			});

			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(201);

			expect(result.body).toMatchObject({
				contextEntityType: 'changemaker',
				changemakerId: changemaker.id,
				verbs: ['view'],
			});
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
			const expectedCreatedByUser = await loadTestUser(db);

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'user',
				granteeUserKeycloakUserId: testUserKeycloakUserId,
				contextEntityType: 'changemaker',
				changemakerId: changemaker.id,
				scope: ['changemaker'],
				verbs: ['view', 'edit'],
				createdBy: testUserKeycloakUserId,
				createdByUser: expectedCreatedByUser,
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
			const expectedCreatedByUser = await loadTestUser(db);

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'userGroup',
				granteeKeycloakOrganizationId: userGroupKeycloakId,
				contextEntityType: 'funder',
				funderShortCode: funder.shortCode,
				scope: ['funder'],
				verbs: ['view', 'create'],
				createdBy: testUserKeycloakUserId,
				createdByUser: expectedCreatedByUser,
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
			const expectedCreatedByUser = await loadTestUser(db);

			expect(result.body).toMatchObject({
				id: expectNumber(),
				granteeType: 'user',
				granteeUserKeycloakUserId: arbitraryUserKeycloakUserId,
				contextEntityType: 'changemaker',
				changemakerId: changemaker.id,
				scope: ['changemaker'],
				verbs: ['view'],
				createdBy: testUserKeycloakUserId,
				createdByUser: expectedCreatedByUser,
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

		it('returns 400 bad request when contextEntityType is `any`', async () => {
			const result = await agent
				.post('/permissionGrants')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'any',
					scope: ['any'],
					verbs: ['view'],
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
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
			const funder = await createTestFunder(db, authContext);
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
			const expectedCreatedByUser = await loadTestUser(db);

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
				createdByUser: expectedCreatedByUser,
				createdAt: expectTimestamp(),
			});
		});

		it('creates a permission grant with null conditions', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const funder = await createTestFunder(db, authContext);
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
			const funder = await createTestFunder(db, authContext);
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
			const funder = await createTestFunder(db, authContext);
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
			const funder = await createTestFunder(db, authContext);
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
			const funder = await createTestFunder(db, authContext);
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

		describe('authenticatedUsers grantee type', () => {
			it('creates and returns a grant with both grantee key fields null', async () => {
				const db = getDatabase();
				const authContext = await getTestAuthContext(db);
				const changemaker = await createTestChangemaker(db, authContext);
				const before = await loadTableMetrics(db, 'permission_grants');
				const result = await agent
					.post('/permissionGrants')
					.type('application/json')
					.set(adminUserAuthHeader)
					.send({
						granteeType: 'authenticatedUsers',
						contextEntityType: 'changemaker',
						changemakerId: changemaker.id,
						scope: ['changemaker'],
						verbs: ['view'],
					})
					.expect(201);
				const after = await loadTableMetrics(db, 'permission_grants');

				expect(result.body).toMatchObject({
					id: expectNumber(),
					granteeType: 'authenticatedUsers',
					granteeUserKeycloakUserId: null,
					granteeKeycloakOrganizationId: null,
					contextEntityType: 'changemaker',
					changemakerId: changemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				});
				expect(after.count).toEqual(before.count + 1);
			});

			it('returns 400 when grantee key field is included', async () => {
				const db = getDatabase();
				const authContext = await getTestAuthContext(db);
				const changemaker = await createTestChangemaker(db, authContext);
				await agent
					.post('/permissionGrants')
					.type('application/json')
					.set(adminUserAuthHeader)
					.send({
						granteeType: 'authenticatedUsers',
						granteeUserKeycloakUserId: testUserKeycloakUserId,
						contextEntityType: 'changemaker',
						changemakerId: changemaker.id,
						scope: ['changemaker'],
						verbs: ['view'],
					})
					.expect(400);
			});

			it('grants permission to an arbitrary authenticated user', async () => {
				const db = getDatabase();
				const adminAuthContext = await getTestAuthContext(db, true);
				const funder = await createTestFunder(db, adminAuthContext);
				await createPermissionGrant(db, adminAuthContext, {
					granteeType: PermissionGrantGranteeType.AUTHENTICATED_USERS,
					contextEntityType: PermissionGrantEntityType.FUNDER,
					funderShortCode: funder.shortCode,
					scope: [PermissionGrantEntityType.FUNDER],
					verbs: [PermissionGrantVerb.VIEW],
				});

				const arbitraryUser = await loadTestUser(db);
				const arbitraryUserAuthContext = getAuthContext(arbitraryUser);

				const allowed = await hasFunderPermission(
					db,
					arbitraryUserAuthContext,
					{
						funderShortCode: funder.shortCode,
						permission: PermissionGrantVerb.VIEW,
						scope: PermissionGrantEntityType.FUNDER,
					},
				);
				expect(allowed).toBe(true);
			});

			it('propagates through context inheritance (funder grant covers application form)', async () => {
				const db = getDatabase();
				const adminAuthContext = await getTestAuthContext(db, true);
				const funder = await createTestFunder(db, adminAuthContext);
				const opportunity = await createTestOpportunity(db, adminAuthContext, {
					funderShortCode: funder.shortCode,
				});
				const applicationForm = await createApplicationForm(
					db,
					adminAuthContext,
					{
						opportunityId: opportunity.id,
						name: 'test form',
					},
				);
				await createPermissionGrant(db, adminAuthContext, {
					granteeType: PermissionGrantGranteeType.AUTHENTICATED_USERS,
					contextEntityType: PermissionGrantEntityType.FUNDER,
					funderShortCode: funder.shortCode,
					scope: [PermissionGrantEntityType.APPLICATION_FORM],
					verbs: [PermissionGrantVerb.VIEW],
				});

				const arbitraryUser = await loadTestUser(db);
				const arbitraryUserAuthContext = getAuthContext(arbitraryUser);

				const allowed = await hasApplicationFormPermission(
					db,
					arbitraryUserAuthContext,
					{
						applicationFormId: applicationForm.id,
						permission: PermissionGrantVerb.VIEW,
						scope: PermissionGrantEntityType.APPLICATION_FORM,
					},
				);
				expect(allowed).toBe(true);
			});

			it('does not enable permission for unauthenticated requests', async () => {
				const db = getDatabase();
				const adminAuthContext = await getTestAuthContext(db, true);
				const funder = await createTestFunder(db, adminAuthContext);
				await createPermissionGrant(db, adminAuthContext, {
					granteeType: PermissionGrantGranteeType.AUTHENTICATED_USERS,
					contextEntityType: PermissionGrantEntityType.FUNDER,
					funderShortCode: funder.shortCode,
					scope: [PermissionGrantEntityType.FUNDER],
					verbs: [PermissionGrantVerb.VIEW],
				});

				await agent.get('/permissionGrants').expect(401);
			});
		});
	});

	describe('PUT /:permissionGrantId', () => {
		it('requires authentication', async () => {
			await agent.put('/permissionGrants/1').expect(401);
		});

		it('returns 404 to a non-admin without manage permission on the existing context entity', async () => {
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
			await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(authHeader)
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

		it('rejects non-admin who can manage the existing entity but not the proposed entity', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const manageableChangemaker = await createTestChangemaker(
				db,
				authContext,
			);
			const unmanageableChangemaker = await createTestChangemaker(
				db,
				authContext,
			);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: manageableChangemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.MANAGE],
			});
			const permissionGrant = await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: manageableChangemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.VIEW],
			});

			await agent
				.put(`/permissionGrants/${permissionGrant.id}`)
				.type('application/json')
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: unmanageableChangemaker.id,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(403);
		});

		it('returns 404 to a non-admin when the proposed context entity does not exist', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.MANAGE],
			});
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
				.set(authHeader)
				.send({
					granteeType: 'user',
					granteeUserKeycloakUserId: testUserKeycloakUserId,
					contextEntityType: 'changemaker',
					changemakerId: 9001,
					scope: ['changemaker'],
					verbs: ['view'],
				})
				.expect(404);
			expect(result.body).toMatchObject({
				name: 'NotFoundError',
			});
		});

		it('allows non-admin with manage permission to update a grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.MANAGE],
			});
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
				.set(authHeader)
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
				verbs: ['view', 'edit'],
			});
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
			const expectedCreatedByUser = await loadTestUser(db);

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
				createdByUser: expectedCreatedByUser,
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

		it('returns 404 to a non-admin without manage permission on the context entity', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const permissionGrant = await createTestPermissionGrant(db, authContext);
			await agent
				.delete(`/permissionGrants/${permissionGrant.id}`)
				.set(authHeader)
				.expect(404);
		});

		it('allows non-admin with manage permission to delete a grant', async () => {
			const db = getDatabase();
			const authContext = await getTestAuthContext(db);
			const changemaker = await createTestChangemaker(db, authContext);
			await createTestPermissionGrant(db, authContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.CHANGEMAKER],
				verbs: [PermissionGrantVerb.MANAGE],
			});
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
				.delete(`/permissionGrants/${permissionGrant.id}`)
				.set(authHeader)
				.expect(204);

			const after = await loadTableMetrics(db, 'permission_grants');
			expect(after.count).toEqual(before.count - 1);
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
			const source = await createTestSource(db, authContext, {
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

describe('`any` scope semantics', () => {
	const expectAllTrue = async (
		checks: Array<Promise<boolean>>,
	): Promise<void> => {
		const results = await Promise.all(checks);
		results.forEach((result) => {
			expect(result).toBe(true);
		});
	};

	it('satisfies any scope check on a funder grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const funder = await createTestFunder(db, testUserAuthContext);

		await agent
			.post('/permissionGrants')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.ANY],
				verbs: [PermissionGrantVerb.VIEW],
			})
			.expect(201);

		await expectAllTrue([
			hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.FUNDER,
			}),
			hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.OPPORTUNITY,
			}),
			hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.PROPOSAL,
			}),
			hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
			}),
		]);
	});

	it('satisfies any scope check on a changemaker grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const changemaker = await createTestChangemaker(db, testUserAuthContext);

		await agent
			.post('/permissionGrants')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: changemaker.id,
				scope: [PermissionGrantEntityType.ANY],
				verbs: [PermissionGrantVerb.VIEW],
			})
			.expect(201);

		await expectAllTrue([
			hasChangemakerPermission(db, testUserAuthContext, {
				changemakerId: changemaker.id,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.CHANGEMAKER,
			}),
			hasChangemakerPermission(db, testUserAuthContext, {
				changemakerId: changemaker.id,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.PROPOSAL,
			}),
			hasChangemakerPermission(db, testUserAuthContext, {
				changemakerId: changemaker.id,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
			}),
		]);
	});

	it('does not extend `any` scope to a different context', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const ownedFunder = await createTestFunder(db, testUserAuthContext);
		const otherFunder = await createTestFunder(db, testUserAuthContext);

		await agent
			.post('/permissionGrants')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: ownedFunder.shortCode,
				scope: [PermissionGrantEntityType.ANY],
				verbs: [PermissionGrantVerb.VIEW],
			})
			.expect(201);

		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: otherFunder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.FUNDER,
			}),
		).toBe(false);
	});

	it('does not satisfy a verb that is not in the grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const funder = await createTestFunder(db, testUserAuthContext);

		await agent
			.post('/permissionGrants')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.ANY],
				verbs: [PermissionGrantVerb.VIEW],
			})
			.expect(201);

		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.EDIT,
				scope: PermissionGrantEntityType.FUNDER,
			}),
		).toBe(false);
	});

	it('combined with `manage` grants every verb on every scope', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const funder = await createTestFunder(db, testUserAuthContext);

		await agent
			.post('/permissionGrants')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.ANY],
				verbs: [PermissionGrantVerb.MANAGE],
			})
			.expect(201);

		await expectAllTrue(
			[
				PermissionGrantVerb.VIEW,
				PermissionGrantVerb.CREATE,
				PermissionGrantVerb.EDIT,
				PermissionGrantVerb.DELETE,
				PermissionGrantVerb.REFERENCE,
			].flatMap((verb) => [
				hasFunderPermission(db, testUserAuthContext, {
					funderShortCode: funder.shortCode,
					permission: verb,
					scope: PermissionGrantEntityType.FUNDER,
				}),
				hasFunderPermission(db, testUserAuthContext, {
					funderShortCode: funder.shortCode,
					permission: verb,
					scope: PermissionGrantEntityType.OPPORTUNITY,
				}),
				hasFunderPermission(db, testUserAuthContext, {
					funderShortCode: funder.shortCode,
					permission: verb,
					scope: PermissionGrantEntityType.PROPOSAL,
				}),
			]),
		);
	});

	it('extends to opportunities inherited from a funder', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const funder = await createTestFunder(db, testUserAuthContext);
		const opportunity = await createTestOpportunity(db, testUserAuthContext, {
			funderShortCode: funder.shortCode,
		});

		await agent
			.post('/permissionGrants')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.ANY],
				verbs: [PermissionGrantVerb.VIEW],
			})
			.expect(201);

		expect(
			await hasOpportunityPermission(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.OPPORTUNITY,
			}),
		).toBe(true);
	});

	it('extends to sources inherited from a data provider', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const dataProvider = await createTestDataProvider(db, testUserAuthContext);
		const source = await createTestSource(db, testUserAuthContext, {
			dataProviderShortCode: dataProvider.shortCode,
		});

		await agent
			.post('/permissionGrants')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: dataProvider.shortCode,
				scope: [PermissionGrantEntityType.ANY],
				verbs: [PermissionGrantVerb.VIEW],
			})
			.expect(201);

		await expectAllTrue([
			hasDataProviderPermission(db, testUserAuthContext, {
				dataProviderShortCode: dataProvider.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.DATA_PROVIDER,
			}),
			hasSourcePermission(db, testUserAuthContext, {
				sourceId: source.id,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.SOURCE,
			}),
		]);
	});

	it('extends to a proposal inherited from an opportunity', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const opportunity = await createTestOpportunity(db, testUserAuthContext);
		const proposal = await createTestProposal(db, testUserAuthContext, {
			externalId: 'any-scope-inherited-proposal',
			opportunityId: opportunity.id,
		});

		await agent
			.post('/permissionGrants')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: opportunity.id,
				scope: [PermissionGrantEntityType.ANY],
				verbs: [PermissionGrantVerb.VIEW],
			})
			.expect(201);

		expect(
			await hasProposalPermission(db, testUserAuthContext, {
				proposalId: proposal.id,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.PROPOSAL,
			}),
		).toBe(true);
	});
});
