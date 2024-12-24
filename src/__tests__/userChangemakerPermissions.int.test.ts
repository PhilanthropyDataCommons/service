import request from 'supertest';
import { app } from '../app';
import {
	createChangemaker,
	createOrUpdateUserChangemakerPermission,
	loadSystemUser,
	loadUserChangemakerPermission,
	removeUserChangemakerPermission,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { keycloakIdToString, Permission } from '../types';
import { NotFoundError } from '../errors';

describe('/users/changemakers/:changemakerId/permissions/:permission', () => {
	describe('PUT /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.send({})
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(401);
		});

		it('returns 400 if the userId is not a valid keycloak user ID', async () => {
			await request(app)
				.put(`/users/notaguid/changemakers/1/permissions/${Permission.MANAGE}`)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the changemaker ID is not a valid ID', async () => {
			const user = await loadTestUser();
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/notanId/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const user = await loadTestUser();
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/1/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('creates and returns the new user changemaker permission when user has administrative credentials', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});

			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				changemakerId: changemaker.id,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: user.keycloakUserId,
			});
		});

		it('creates and returns the new user changemaker permission when user has permission to manage the changemaker', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission({
				userKeycloakUserId: user.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.MANAGE,
				createdBy: user.keycloakUserId,
			});
			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				changemakerId: changemaker.id,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: user.keycloakUserId,
			});
		});

		it('does not update `createdBy`, but returns the user changemaker permission when user has permission to manage the changemaker', async () => {
			const user = await loadTestUser();
			const systemUser = await loadSystemUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission({
				userKeycloakUserId: user.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.MANAGE,
				createdBy: systemUser.keycloakUserId,
			});
			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				changemakerId: changemaker.id,
				createdAt: expectTimestamp,
				createdBy: systemUser.keycloakUserId,
				permission: Permission.MANAGE,
				userKeycloakUserId: user.keycloakUserId,
			});
		});
	});

	describe('DELETE /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.send()
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send()
				.expect(401);
		});

		it('returns 400 if the userId is not a valid keycloak user ID', async () => {
			await request(app)
				.delete(
					`/users/notaguid/changemakers/1/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the changemaker ID is not a valid ID', async () => {
			const user = await loadTestUser();
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/notanId/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const user = await loadTestUser();
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/1/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 404 if the permission does not exist', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('returns 404 if the permission had existed and previously been deleted', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission({
				userKeycloakUserId: user.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.EDIT,
				createdBy: user.keycloakUserId,
			});
			await removeUserChangemakerPermission(
				user.keycloakUserId,
				changemaker.id,
				Permission.EDIT,
			);
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('deletes the user changemaker permission when the user has administrative credentials', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission({
				userKeycloakUserId: user.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.EDIT,
				createdBy: user.keycloakUserId,
			});
			const permission = await loadUserChangemakerPermission(
				user.keycloakUserId,
				changemaker.id,
				Permission.EDIT,
			);
			expect(permission).toEqual({
				changemakerId: changemaker.id,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: user.keycloakUserId,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(204);
			await expect(
				loadUserChangemakerPermission(
					user.keycloakUserId,
					changemaker.id,
					Permission.EDIT,
				),
			).rejects.toThrow(NotFoundError);
		});

		it('deletes the user changemaker permission when the user has permission to manage the changemaker', async () => {
			const user = await loadTestUser();
			const changemaker = await createChangemaker({
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission({
				userKeycloakUserId: user.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.MANAGE,
				createdBy: user.keycloakUserId,
			});
			await createOrUpdateUserChangemakerPermission({
				userKeycloakUserId: user.keycloakUserId,
				changemakerId: changemaker.id,
				permission: Permission.EDIT,
				createdBy: user.keycloakUserId,
			});
			const permission = await loadUserChangemakerPermission(
				user.keycloakUserId,
				changemaker.id,
				Permission.EDIT,
			);
			expect(permission).toEqual({
				changemakerId: changemaker.id,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: user.keycloakUserId,
			});
			await request(app)
				.delete(
					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
				)
				.set(authHeader)
				.send()
				.expect(204);
			await expect(
				loadUserChangemakerPermission(
					user.keycloakUserId,
					changemaker.id,
					Permission.EDIT,
				),
			).rejects.toThrow(NotFoundError);
		});
	});
});
