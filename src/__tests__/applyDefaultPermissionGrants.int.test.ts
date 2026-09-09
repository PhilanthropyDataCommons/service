import request from 'supertest';
import { app } from '../app';
import {
	getDatabase,
	loadPermissionGrantBundle,
	loadSystemUser,
} from '../database';
import {
	expectArrayContaining,
	expectNumber,
	expectObjectContaining,
} from '../test/asymettricMatchers';
import {
	createTestDefaultPermissionGrant,
	createTestFunder,
} from '../test/factories';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
	mockOrgId,
} from '../test/mockJwt';
import {
	getAuthContext,
	getTestAuthContext,
	loadTestUser,
	NO_LIMIT,
	NO_OFFSET,
} from '../test/utils';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
	stringToKeycloakId,
} from '../types';
import type { Bundle, PermissionGrant } from '../types';

const agent = request.agent(app);

const granteeKeycloakOrganizationId = stringToKeycloakId(mockOrgId);

const loadAllPermissionGrants = async (): Promise<Bundle<PermissionGrant>> => {
	const db = getDatabase();
	const systemUser = await loadSystemUser(db, null);
	return await loadPermissionGrantBundle(
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
};

describe('default permission grant application', () => {
	it('grants the permission each default permission grant for the entity type describes', async () => {
		const db = getDatabase();
		const authContext = await getTestAuthContext(db);
		await createTestDefaultPermissionGrant(db, authContext, {
			granteeType: PermissionGrantGranteeType.USER_GROUP,
			granteeKeycloakOrganizationId,
			contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
			scope: [PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE],
			verbs: [PermissionGrantVerb.EDIT],
		});
		await agent
			.post('/changemakers')
			.type('application/json')
			.set(authHeader)
			.send({
				taxId: '11-1111111',
				name: 'Default Grant Co.',
				keycloakOrganizationId: null,
			})
			.expect(201);

		const grants = await loadAllPermissionGrants();
		expect(grants.entries).toEqual(
			expectArrayContaining([
				expectObjectContaining({
					granteeType: 'userGroup',
					granteeKeycloakOrganizationId: mockOrgId,
					contextEntityType: 'changemaker',
					changemakerId: expectNumber(),
					scope: ['changemakerFieldValue'],
					verbs: ['edit'],
				}),
			]),
		);
	});

	it('carries the conditions of a default permission grant', async () => {
		const db = getDatabase();
		const authContext = await getTestAuthContext(db);
		await createTestDefaultPermissionGrant(db, authContext, {
			granteeType: PermissionGrantGranteeType.USER_GROUP,
			granteeKeycloakOrganizationId,
			contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
			scope: [PermissionGrantEntityType.PROPOSAL_FIELD_VALUE],
			verbs: [PermissionGrantVerb.VIEW],
			conditions: {
				proposalFieldValue: {
					property: 'baseFieldCategory',
					operator: 'in',
					value: ['project'],
				},
			},
		});
		await agent
			.post('/changemakers')
			.type('application/json')
			.set(authHeader)
			.send({
				taxId: '11-1111111',
				name: 'Default Grant Co.',
				keycloakOrganizationId: null,
			})
			.expect(201);

		const grants = await loadAllPermissionGrants();
		expect(grants.entries).toEqual(
			expectArrayContaining([
				expectObjectContaining({
					granteeType: 'userGroup',
					contextEntityType: 'changemaker',
					conditions: {
						proposalFieldValue: {
							property: 'baseFieldCategory',
							operator: 'in',
							value: ['project'],
						},
					},
				}),
			]),
		);
	});

	it('ignores default permission grants registered for another context entity type', async () => {
		const db = getDatabase();
		const authContext = await getTestAuthContext(db);
		await createTestDefaultPermissionGrant(db, authContext, {
			granteeType: PermissionGrantGranteeType.USER_GROUP,
			granteeKeycloakOrganizationId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			scope: [PermissionGrantEntityType.FUNDER],
			verbs: [PermissionGrantVerb.EDIT],
		});
		await agent
			.post('/changemakers')
			.type('application/json')
			.set(authHeader)
			.send({
				taxId: '11-1111111',
				name: 'Default Grant Co.',
				keycloakOrganizationId: null,
			})
			.expect(201);

		const grants = await loadAllPermissionGrants();
		const testUser = await loadTestUser(db);
		expect(grants.entries).toEqual([
			expectObjectContaining({
				granteeType: 'user',
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: 'changemaker',
				scope: ['any'],
				verbs: ['manage'],
			}),
		]);
	});

	it('applies default permission grants to an entity keyed by short code', async () => {
		const db = getDatabase();
		const authContext = await getTestAuthContext(db);
		await createTestDefaultPermissionGrant(db, authContext, {
			granteeType: PermissionGrantGranteeType.USER_GROUP,
			granteeKeycloakOrganizationId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			scope: [PermissionGrantEntityType.OPPORTUNITY],
			verbs: [PermissionGrantVerb.EDIT],
		});
		await agent
			.put('/funders/default_grant_funder')
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({ name: 'Default Grant Funder', isCollaborative: false })
			.expect(201);

		const grants = await loadAllPermissionGrants();
		expect(grants.entries).toEqual(
			expectArrayContaining([
				expectObjectContaining({
					granteeType: 'userGroup',
					granteeKeycloakOrganizationId: mockOrgId,
					contextEntityType: 'funder',
					funderShortCode: 'default_grant_funder',
					scope: ['opportunity'],
					verbs: ['edit'],
				}),
			]),
		);
	});

	it('does not apply default permission grants when a PUT updates an existing entity', async () => {
		const db = getDatabase();
		const authContext = await getTestAuthContext(db);
		const funder = await createTestFunder(db, authContext, {
			shortCode: 'default_grant_funder',
		});
		await createTestDefaultPermissionGrant(db, authContext, {
			granteeType: PermissionGrantGranteeType.USER_GROUP,
			granteeKeycloakOrganizationId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			scope: [PermissionGrantEntityType.OPPORTUNITY],
			verbs: [PermissionGrantVerb.EDIT],
		});
		await agent
			.put(`/funders/${funder.shortCode}`)
			.type('application/json')
			.set(adminUserAuthHeader)
			.send({ name: 'Renamed Funder', isCollaborative: false })
			.expect(200);

		const grants = await loadAllPermissionGrants();
		expect(grants.entries).toEqual([]);
	});
});
