import request from 'supertest';
import { app } from '../app';
import {
	db,
	createChangemaker,
	createOrUpdateOrganizationChangemakerPermission,
	loadSystemUser,
	loadUserChangemakerPermission,
	removeUserChangemakerPermission,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { KeycloakId, keycloakIdToString, Permission } from '../types';
import { NotFoundError } from '../errors';

const mockKeycloakOrganizationId = '123e4567-e89b-12d3-a456-426614174000';

describe('/organizations/changemakers/:changemakerId/permissions/:permission', () => {
	describe('PUT /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const organizationAsChangemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111112',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/organizations/${keycloakIdToString(organizationAsChangemaker.keycloakOrganizationId as KeycloakId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.send({})
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const organizationAsChangemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111112',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/organizations/${keycloakIdToString(organizationAsChangemaker.keycloakOrganizationId as KeycloakId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(401);
		});

		it('returns 400 if the organizationKeycloakId is not a valid keycloak organization ID', async () => {
			await request(app)
				.put(
					`/organizations/notaguid/changemakers/1/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the changemaker ID is not a valid ID', async () => {
			const organizationAsChangemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.put(
					`/organizations/${keycloakIdToString(organizationAsChangemaker.keycloakOrganizationId as KeycloakId)}/changemakers/notanId/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const organizationAsChangemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.put(
					`/organizations/${keycloakIdToString(organizationAsChangemaker.keycloakOrganizationId as KeycloakId)}/changemakers/1/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('creates and returns the new organization changemaker permission when user has administrative credentials', async () => {
			const user = await loadTestUser();

			const organizationAsChangemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111112',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});

			const response = await request(app)
				.put(
					`/organizations/${keycloakIdToString(organizationAsChangemaker.keycloakOrganizationId as KeycloakId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				changemakerId: changemaker.id,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				keycloakOrganizationId:
					organizationAsChangemaker.keycloakOrganizationId,
			});
		});

		it('creates and returns the new organization changemaker permission when organization has permission to manage the changemaker', async () => {
			const user = await loadTestUser();

			const organizationAsChangemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111112',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});

			await createOrUpdateOrganizationChangemakerPermission(db, null, {
				keycloakOrganizationId:
					organizationAsChangemaker.keycloakOrganizationId as KeycloakId,
				changemakerId: changemaker.id,
				permission: Permission.MANAGE,
				createdBy: user.keycloakUserId,
			});
			const response = await request(app)
				.put(
					`/organizations/${keycloakIdToString(organizationAsChangemaker.keycloakOrganizationId as KeycloakId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				changemakerId: changemaker.id,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				keycloakOrganizationId:
					organizationAsChangemaker.keycloakOrganizationId,
			});
		});

		it('does not update `createdBy`, but returns the organization changemaker permission when organization has permission to manage the changemaker', async () => {
			const user = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const organizationAsChangemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			const changemaker = await createChangemaker(db, null, {
				taxId: '11-1111112',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateOrganizationChangemakerPermission(db, null, {
				keycloakOrganizationId: organizationAsChangemaker.keycloakOrganizationId as KeycloakId,
				changemakerId: changemaker.id,
				permission: Permission.MANAGE,
				createdBy: systemUser.keycloakUserId,
			});
			const response = await request(app)
				.put(
					`/organizations/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				changemakerId: changemaker.id,
				createdAt: expectTimestamp,
				createdBy: systemUser.keycloakUserId,
				permission: Permission.MANAGE,
				keycloakOrganizationId:
					organizationAsChangemaker.keycloakOrganizationId,
			});
		});
	});

// 	describe('DELETE /', () => {
// 		it('returns 401 if the request lacks authentication', async () => {
// 			const user = await loadTestUser();
// 			const changemaker = await createChangemaker(db, null, {
// 				taxId: '11-1111111',
// 				name: 'Example Inc.',
// 				keycloakOrganizationId: null,
// 			});
// 			await request(app)
// 				.delete(
// 					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
// 				)
// 				.send()
// 				.expect(401);
// 		});

// 		it('returns 401 if the authenticated user lacks permission', async () => {
// 			const user = await loadTestUser();
// 			const changemaker = await createChangemaker(db, null, {
// 				taxId: '11-1111111',
// 				name: 'Example Inc.',
// 				keycloakOrganizationId: null,
// 			});
// 			await request(app)
// 				.delete(
// 					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
// 				)
// 				.set(authHeader)
// 				.send()
// 				.expect(401);
// 		});

// 		it('returns 400 if the userId is not a valid keycloak user ID', async () => {
// 			await request(app)
// 				.delete(
// 					`/users/notaguid/changemakers/1/permissions/${Permission.MANAGE}`,
// 				)
// 				.set(authHeaderWithAdminRole)
// 				.send()
// 				.expect(400);
// 		});

// 		it('returns 400 if the changemaker ID is not a valid ID', async () => {
// 			const user = await loadTestUser();
// 			await request(app)
// 				.delete(
// 					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/notanId/permissions/${Permission.MANAGE}`,
// 				)
// 				.set(authHeaderWithAdminRole)
// 				.send()
// 				.expect(400);
// 		});

// 		it('returns 400 if the permission is not a valid permission', async () => {
// 			const user = await loadTestUser();
// 			await request(app)
// 				.delete(
// 					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/1/permissions/notAPermission`,
// 				)
// 				.set(authHeaderWithAdminRole)
// 				.send()
// 				.expect(400);
// 		});

// 		it('returns 404 if the permission does not exist', async () => {
// 			const user = await loadTestUser();
// 			const changemaker = await createChangemaker(db, null, {
// 				taxId: '11-1111111',
// 				name: 'Example Inc.',
// 				keycloakOrganizationId: null,
// 			});
// 			await request(app)
// 				.delete(
// 					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.MANAGE}`,
// 				)
// 				.set(authHeaderWithAdminRole)
// 				.send()
// 				.expect(404);
// 		});

// 		it('returns 404 if the permission had existed and previously been deleted', async () => {
// 			const user = await loadTestUser();
// 			const changemaker = await createChangemaker(db, null, {
// 				taxId: '11-1111111',
// 				name: 'Example Inc.',
// 				keycloakOrganizationId: null,
// 			});
// 			await createOrUpdateUserChangemakerPermission(db, null, {
// 				userKeycloakUserId: user.keycloakUserId,
// 				changemakerId: changemaker.id,
// 				permission: Permission.EDIT,
// 				createdBy: user.keycloakUserId,
// 			});
// 			await removeUserChangemakerPermission(
// 				user.keycloakUserId,
// 				changemaker.id,
// 				Permission.EDIT,
// 			);
// 			await request(app)
// 				.delete(
// 					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
// 				)
// 				.set(authHeaderWithAdminRole)
// 				.send()
// 				.expect(404);
// 		});

// 		it('deletes the user changemaker permission when the user has administrative credentials', async () => {
// 			const user = await loadTestUser();
// 			const changemaker = await createChangemaker(db, null, {
// 				taxId: '11-1111111',
// 				name: 'Example Inc.',
// 				keycloakOrganizationId: null,
// 			});
// 			await createOrUpdateUserChangemakerPermission(db, null, {
// 				userKeycloakUserId: user.keycloakUserId,
// 				changemakerId: changemaker.id,
// 				permission: Permission.EDIT,
// 				createdBy: user.keycloakUserId,
// 			});
// 			const permission = await loadUserChangemakerPermission(
// 				db,
// 				null,
// 				user.keycloakUserId,
// 				changemaker.id,
// 				Permission.EDIT,
// 			);
// 			expect(permission).toEqual({
// 				changemakerId: changemaker.id,
// 				createdAt: expectTimestamp,
// 				createdBy: user.keycloakUserId,
// 				permission: Permission.EDIT,
// 				userKeycloakUserId: user.keycloakUserId,
// 			});
// 			await request(app)
// 				.delete(
// 					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
// 				)
// 				.set(authHeaderWithAdminRole)
// 				.send()
// 				.expect(204);
// 			await expect(
// 				loadUserChangemakerPermission(
// 					db,
// 					null,
// 					user.keycloakUserId,
// 					changemaker.id,
// 					Permission.EDIT,
// 				),
// 			).rejects.toThrow(NotFoundError);
// 		});

// 		it('deletes the user changemaker permission when the user has permission to manage the changemaker', async () => {
// 			const user = await loadTestUser();
// 			const changemaker = await createChangemaker(db, null, {
// 				taxId: '11-1111111',
// 				name: 'Example Inc.',
// 				keycloakOrganizationId: null,
// 			});
// 			await createOrUpdateUserChangemakerPermission(db, null, {
// 				userKeycloakUserId: user.keycloakUserId,
// 				changemakerId: changemaker.id,
// 				permission: Permission.MANAGE,
// 				createdBy: user.keycloakUserId,
// 			});
// 			await createOrUpdateUserChangemakerPermission(db, null, {
// 				userKeycloakUserId: user.keycloakUserId,
// 				changemakerId: changemaker.id,
// 				permission: Permission.EDIT,
// 				createdBy: user.keycloakUserId,
// 			});
// 			const permission = await loadUserChangemakerPermission(
// 				db,
// 				null,
// 				user.keycloakUserId,
// 				changemaker.id,
// 				Permission.EDIT,
// 			);
// 			expect(permission).toEqual({
// 				changemakerId: changemaker.id,
// 				createdAt: expectTimestamp,
// 				createdBy: user.keycloakUserId,
// 				permission: Permission.EDIT,
// 				userKeycloakUserId: user.keycloakUserId,
// 			});
// 			await request(app)
// 				.delete(
// 					`/users/${keycloakIdToString(user.keycloakUserId)}/changemakers/${changemaker.id}/permissions/${Permission.EDIT}`,
// 				)
// 				.set(authHeader)
// 				.send()
// 				.expect(204);
// 			await expect(
// 				loadUserChangemakerPermission(
// 					db,
// 					null,
// 					user.keycloakUserId,
// 					changemaker.id,
// 					Permission.EDIT,
// 				),
// 			).rejects.toThrow(NotFoundError);
// 		});
// 	});
});
