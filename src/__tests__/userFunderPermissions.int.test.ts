import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOrUpdateFunder,
	createOrUpdateUserFunderPermission,
	loadSystemUser,
	loadUserFunderPermission,
	removeUserFunderPermission,
} from '../database';
import { expectTimestamp, getAuthContext, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { keycloakIdToString, Permission } from '../types';
import { NotFoundError } from '../errors';

describe('/users/funders/:funderShortcode/permissions/:permission', () => {
	describe('PUT /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const user = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.send({})
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const user = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});

			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(401);
		});

		it('returns 400 if the userId is not a valid keycloak user ID', async () => {
			await request(app)
				.put(
					`/users/notaguid/funders/ExampleInc/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the funder ID is not a valid shortcode', async () => {
			const user = await loadTestUser();
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/this is not valid/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const user = await loadTestUser();
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/ExampleInc/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('creates and returns the new user funder permission when user has administrative credentials', async () => {
			const user = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});

			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				funderShortCode: funder.shortCode,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: user.keycloakUserId,
			});
		});

		it('creates and returns the new user funder permission when user has permission to manage the funder', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserFunderPermission(db, testUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.MANAGE,
			});

			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(testUser.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				funderShortCode: funder.shortCode,
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: testUser.keycloakUserId,
			});
		});

		it('does not update `createdBy`, but returns the user funder permission when user has permission to manage the funder', async () => {
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.MANAGE,
			});

			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(testUser.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				funderShortCode: funder.shortCode,
				createdAt: expectTimestamp,
				createdBy: systemUser.keycloakUserId,
				permission: Permission.MANAGE,
				userKeycloakUserId: testUser.keycloakUserId,
			});
		});
	});

	describe('DELETE /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const user = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.send()
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const user = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send()
				.expect(401);
		});

		it('returns 400 if the userId is not a valid keycloak user ID', async () => {
			await request(app)
				.delete(`/users/notaguid/funders/1/permissions/${Permission.MANAGE}`)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the funder shortCode is not a valid shortCode', async () => {
			const user = await loadTestUser();
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/not a valid short code/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const user = await loadTestUser();
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/ExampleInc/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 404 if the permission does not exist', async () => {
			const user = await loadTestUser();
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.MANAGE}`,
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
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserFunderPermission(db, testUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.EDIT,
			});
			await removeUserFunderPermission(
				db,
				null,
				testUser.keycloakUserId,
				funder.shortCode,
				Permission.EDIT,
			);
			await request(app)
				.delete(
					`/users/${keycloakIdToString(testUser.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('deletes the user funder permission when the user has administrative credentials', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserFunderPermission(db, testUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.EDIT,
			});
			const permission = await loadUserFunderPermission(
				db,
				null,
				testUser.keycloakUserId,
				funder.shortCode,
				Permission.EDIT,
			);
			expect(permission).toEqual({
				funderShortCode: funder.shortCode,
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: testUser.keycloakUserId,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(testUser.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(204);
			await expect(
				loadUserFunderPermission(
					db,
					null,
					testUser.keycloakUserId,
					funder.shortCode,
					Permission.EDIT,
				),
			).rejects.toThrow(NotFoundError);
		});

		it('deletes the user funder permission when the user has permission to manage the funder', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserFunderPermission(db, testUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.MANAGE,
			});
			await createOrUpdateUserFunderPermission(db, testUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: funder.shortCode,
				permission: Permission.EDIT,
			});
			const permission = await loadUserFunderPermission(
				db,
				null,
				testUser.keycloakUserId,
				funder.shortCode,
				Permission.EDIT,
			);
			expect(permission).toEqual({
				funderShortCode: funder.shortCode,
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: testUser.keycloakUserId,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(testUser.keycloakUserId)}/funders/${funder.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeader)
				.send()
				.expect(204);
			await expect(
				loadUserFunderPermission(
					db,
					null,
					testUser.keycloakUserId,
					funder.shortCode,
					Permission.EDIT,
				),
			).rejects.toThrow(NotFoundError);
		});
	});
});
