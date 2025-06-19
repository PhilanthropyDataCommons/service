import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOrUpdateFunder,
	createOrUpdateUserGroupFunderPermission,
	loadUserGroupFunderPermission,
	removeUserGroupFunderPermission,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { keycloakIdToString, Permission, stringToKeycloakId } from '../types';
import { NotFoundError } from '../errors';

const mockKeycloakOrganizationId = stringToKeycloakId(
	'123e4567-e89b-12d3-a456-426614174000',
);

describe('/userGroups/funders/:funderShortcode/permissions/:permission', () => {
	describe('PUT /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.send({})
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(401);
		});

		it('returns 400 if the organizationKeycloakId is not a valid keycloak organization ID', async () => {
			await request(app)
				.put(
					`/userGroups/notaguid/funders/ExampleInc/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the funder shortCode is not a valid short code', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/this is not valid/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('creates and returns the new userGroup funder permission when user has administrative credentials', async () => {
			const user = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			const response = await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				funderShortCode: funder.shortCode,
				createdAt: expectTimestamp(),
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				keycloakOrganizationId: funder.keycloakOrganizationId,
			});
		});
	});

	describe('DELETE /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.send()
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send()
				.expect(401);
		});

		it('returns 400 if the organizationKeycloakId is not a valid keycloak organization ID', async () => {
			await request(app)
				.delete(
					`/userGroups/notaguid/funders/ExampleInc/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the funder shortCode is not a valid short code', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/this is not valid/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 404 if the permission does not exist', async () => {
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('returns 404 if the permission had existed and previously been deleted', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await createOrUpdateUserGroupFunderPermission(db, testUserAuthContext, {
				keycloakOrganizationId: mockKeycloakOrganizationId,
				funderShortCode: funder.shortCode,
				permission: Permission.EDIT,
			});
			await removeUserGroupFunderPermission(
				db,
				null,
				mockKeycloakOrganizationId,
				funder.shortCode,
				Permission.EDIT,
			);
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('deletes the userGroup funder permission when the user has administrative credentials', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await createOrUpdateUserGroupFunderPermission(db, testUserAuthContext, {
				keycloakOrganizationId: mockKeycloakOrganizationId,
				funderShortCode: funder.shortCode,
				permission: Permission.EDIT,
			});
			const permission = await loadUserGroupFunderPermission(
				db,
				null,
				mockKeycloakOrganizationId,
				funder.shortCode,
				Permission.EDIT,
			);
			expect(permission).toEqual({
				funderShortCode: funder.shortCode,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
				permission: Permission.EDIT,
				keycloakOrganizationId: funder.keycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						funder.keycloakOrganizationId,
					)}/funders/${funder.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(204);
			await expect(
				loadUserGroupFunderPermission(
					db,
					null,
					mockKeycloakOrganizationId,
					funder.shortCode,
					Permission.EDIT,
				),
			).rejects.toThrow(NotFoundError);
		});
	});
});
