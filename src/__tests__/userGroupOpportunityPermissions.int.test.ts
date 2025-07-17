import request from 'supertest';
import { app } from '../app';
import {
	db,
	loadSystemFunder,
	createOpportunity,
	removeUserGroupOpportunityPermission,
	createOrUpdateUserGroupOpportunityPermission,
	loadUserGroupOpportunityPermission,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import {
	keycloakIdToString,
	OpportunityPermission,
	stringToKeycloakId,
} from '../types';
import { NotFoundError } from '../errors';

const mockKeycloakOrganizationId = stringToKeycloakId(
	'123e4567-e89b-12d3-a456-426614174000',
);

describe('/userGroups/opportunities/:opportunityId/permissions/:opportunityPermission', () => {
	describe('PUT /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.MANAGE}`,
				)
				.send({})
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(401);
		});

		it('returns 400 if the organizationKeycloakId is not a valid keycloak organization ID', async () => {
			await request(app)
				.put(
					`/userGroups/notaguid/opportunities/1/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the opportunityId is not a valid Id', async () => {
			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/this is not valid/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});

			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/${opportunity.id}/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('creates and returns the new userGroup opportunity permission when user has administrative credentials', async () => {
			const user = await loadTestUser();
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});

			const response = await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				opportunityId: opportunity.id,
				createdAt: expectTimestamp(),
				createdBy: user.keycloakUserId,
				opportunityPermission: OpportunityPermission.EDIT,
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
		});
	});

	describe('DELETE /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/1/permissions/${OpportunityPermission.MANAGE}`,
				)
				.send()
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/1/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeader)
				.send()
				.expect(401);
		});

		it('returns 400 if the organizationKeycloakId is not a valid keycloak organization ID', async () => {
			await request(app)
				.delete(
					`/userGroups/notaguid/opportunities/1/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the opportunityId is not a valid Id', async () => {
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/this is not valid/permissions/${OpportunityPermission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the opportunityPermission is not a valid permission', async () => {
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/1/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 404 if the opportunity permission does not exist', async () => {
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.MANAGE}`,
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
			await createOrUpdateUserGroupOpportunityPermission(
				db,
				testUserAuthContext,
				{
					keycloakOrganizationId: mockKeycloakOrganizationId,
					opportunityId: opportunity.id,
					opportunityPermission: OpportunityPermission.EDIT,
				},
			);
			await removeUserGroupOpportunityPermission(
				db,
				null,
				mockKeycloakOrganizationId,
				opportunity.id,
				OpportunityPermission.EDIT,
			);
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('deletes the userGroup opportunity permission when the user has administrative credentials', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await createOrUpdateUserGroupOpportunityPermission(
				db,
				testUserAuthContext,
				{
					keycloakOrganizationId: mockKeycloakOrganizationId,
					opportunityId: opportunity.id,
					opportunityPermission: OpportunityPermission.EDIT,
				},
			);
			const permission = await loadUserGroupOpportunityPermission(
				db,
				null,
				mockKeycloakOrganizationId,
				opportunity.id,
				OpportunityPermission.EDIT,
			);
			expect(permission).toEqual({
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
				opportunityId: opportunity.id,
				opportunityPermission: OpportunityPermission.EDIT,
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						mockKeycloakOrganizationId,
					)}/opportunities/${opportunity.id}/permissions/${OpportunityPermission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(204);
			await expect(
				loadUserGroupOpportunityPermission(
					db,
					null,
					mockKeycloakOrganizationId,
					opportunity.id,
					OpportunityPermission.EDIT,
				),
			).rejects.toThrow(NotFoundError);
		});
	});
});
