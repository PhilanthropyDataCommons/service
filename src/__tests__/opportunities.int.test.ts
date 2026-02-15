import request from 'supertest';
import { app } from '../app';
import {
	db,
	createEphemeralUserGroupAssociation,
	loadTableMetrics,
	loadSystemFunder,
	loadSystemOpportunity,
	createPermissionGrant,
	loadSystemUser,
} from '../database';
import { createTestFunder, createTestOpportunity } from '../test/factories';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
	stringToKeycloakId,
} from '../types';

describe('/opportunities', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/opportunities').expect(401);
		});

		it('returns the system opportunity when no other data is present', async () => {
			const systemOpportunity = await loadSystemOpportunity(db, null);
			await request(app)
				.get('/opportunities')
				.set(authHeaderWithAdminRole)
				.expect(200, {
					entries: [systemOpportunity],
					total: 1,
				});
		});

		it('returns all opportunities present in the database for an admin user', async () => {
			const systemOpportunity = await loadSystemOpportunity(db, null);
			const opportunity1 = await createTestOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
			});
			const opportunity2 = await createTestOpportunity(db, null, {
				title: 'Terrific opportunity 👐',
			});
			const response = await request(app)
				.get('/opportunities')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				entries: [systemOpportunity, opportunity1, opportunity2],
				total: 3,
			});
		});

		it('returns only opportunities the user is allowed to view', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const visibleFunder = await loadSystemFunder(db, null);
			const systemOpportunity = await loadSystemOpportunity(db, null);
			const anotherFunder = await createTestFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const visibleOpportunity = await createTestOpportunity(db, null, {
				title: 'Tremendous opportunity 👌',
				funderShortCode: visibleFunder.shortCode,
			});
			await createTestOpportunity(db, null, {
				funderShortCode: anotherFunder.shortCode,
			});
			const response = await request(app)
				.get('/opportunities')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [systemOpportunity, visibleOpportunity],
				total: 3,
			});
		});
	});

	describe('GET /:opportunityId', () => {
		it('requires authentication', async () => {
			await request(app).get('/opportunities/1').expect(401);
		});

		it('returns exactly one opportunity selected by id', async () => {
			await createTestOpportunity(db, null);
			const secondOpportunity = await createTestOpportunity(db, null);
			await createTestOpportunity(db, null);

			const response = await request(app)
				.get(`/opportunities/${secondOpportunity.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual(secondOpportunity);
		});

		it('returns an opportunity when the user has funder permission', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const visibleFunder = await createTestFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createTestOpportunity(db, null, {
				funderShortCode: visibleFunder.shortCode,
			});
			const response = await request(app)
				.get(`/opportunities/${opportunity.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(opportunity);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await request(app)
				.get('/opportunities/a')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when id is a number greater than 2^32-1', async () => {
			const result = await request(app)
				.get('/opportunities/555555555555555555555555555555')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when id is not found', async () => {
			await createTestOpportunity(db, null);
			await request(app)
				.get('/opportunities/9001')
				.set(authHeaderWithAdminRole)
				.expect(404);
		});

		it('returns 404 when the user does not have view permission', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser();
			const opportunity = await createTestOpportunity(db, null);

			// Also create a userGroup permission grant with an EXPIRED association
			// to verify that expired associations don't grant access
			const expiredOrgId = 'cccccccc-1111-2222-3333-444444444444';
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER_GROUP,
				granteeKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: opportunity.id,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createEphemeralUserGroupAssociation(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				userGroupKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				notAfter: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
			});

			await request(app)
				.get(`/opportunities/${opportunity.id}`)
				.set(authHeader)
				.expect(404);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/opportunities').expect(401);
		});

		it('creates and returns exactly one opportunity when edit funder permission is set', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const systemFunder = await loadSystemFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.EDIT],
			});
			const before = await loadTableMetrics('opportunities');
			const result = await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({
					title: '🎆',
					funderShortCode: systemFunder.shortCode,
				})
				.expect(201);
			const after = await loadTableMetrics('opportunities');
			expect(before.count).toEqual(1);
			expect(result.body).toMatchObject({
				id: 2,
				title: '🎆',
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(2);
		});

		it('returns 401 unauthorized if the user does not have edit permission on the associated funder', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const systemFunder = await loadSystemFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.MANAGE],
			});
			const before = await loadTableMetrics('opportunities');
			await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({
					title: '🎆',
					funderShortCode: systemFunder.shortCode,
				})
				.expect(401);
			const after = await loadTableMetrics('opportunities');
			expect(before.count).toEqual(1);
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no title sent', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const result = await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({ funderShortCode: systemFunder.shortCode })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no funderShortCode sent', async () => {
			const result = await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({ title: '👎' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});
});
