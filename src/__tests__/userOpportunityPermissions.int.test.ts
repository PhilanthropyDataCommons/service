import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOrUpdateFunder,
	loadSystemFunder,
	createOpportunity,
	removeUserOpportunityPermission,
	createOrUpdateUserOpportunityPermission,
	loadUserOpportunityPermission,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { keycloakIdToString, OpportunityPermission } from '../types';
import { NotFoundError } from '../errors';

describe('/users/opportunities/:opportunityId/permissions/:opportunityPermission', () => {
	describe('PUT /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const user = await loadTestUser();
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.MANAGE}`,
				)
				.send({})
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const user = await loadTestUser();
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});

			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(401);
		});

		it('returns 400 if the userId is not a valid keycloak user ID', async () => {
			await request(app)
				.put(
					`/users/notaguid/opportunities/1/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the opportunity ID is not a valid Id', async () => {
			const user = await loadTestUser();
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/this is not valid/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the permission is not a valid opportunity permission', async () => {
			const user = await loadTestUser();
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/1/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('creates and returns the new user opportunity permission when user has administrative credentials', async () => {
			const user = await loadTestUser();
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				opportunityId: opportunity.id,
				createdAt: expectTimestamp(),
				createdBy: user.keycloakUserId,
				opportunityPermission: OpportunityPermission.EDIT,
				userKeycloakUserId: user.keycloakUserId,
			});
		});
	});

	describe('DELETE /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const user = await loadTestUser();
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/1/permissions/${OpportunityPermission.MANAGE}`,
				)
				.send()
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const user = await loadTestUser();
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeader)
				.send()
				.expect(401);
		});

		it('returns 400 if the userId is not a valid keycloak user ID', async () => {
			await request(app)
				.delete(
					`/users/notaguid/opportunities/1/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the opportunity id is not a valid Id', async () => {
			const user = await loadTestUser();
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/not a valid id/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const user = await loadTestUser();
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/1/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 404 if the permission does not exist', async () => {
			const user = await loadTestUser();
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('returns 404 if the permission had existed and previously been deleted', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await createOrUpdateUserOpportunityPermission(db, testUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				opportunityId: opportunity.id,
				opportunityPermission: OpportunityPermission.EDIT,
			});
			await removeUserOpportunityPermission(
				db,
				null,
				testUser.keycloakUserId,
				opportunity.id,
				OpportunityPermission.EDIT,
			);
			await request(app)
				.delete(
					`/users/${keycloakIdToString(testUser.keycloakUserId)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('deletes the user opportunity permission when the user has administrative credentials', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await createOrUpdateUserOpportunityPermission(db, testUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				opportunityId: opportunity.id,
				opportunityPermission: OpportunityPermission.EDIT,
			});
			const permission = await loadUserOpportunityPermission(
				db,
				null,
				testUser.keycloakUserId,
				opportunity.id,
				OpportunityPermission.EDIT,
			);
			expect(permission).toEqual({
				opportunityId: opportunity.id,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
				opportunityPermission: OpportunityPermission.EDIT,
				userKeycloakUserId: testUser.keycloakUserId,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(testUser.keycloakUserId)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(204);
			await expect(
				loadUserOpportunityPermission(
					db,
					null,
					testUser.keycloakUserId,
					opportunity.id,
					OpportunityPermission.EDIT,
				),
			).rejects.toThrow(NotFoundError);
		});
	});
});
