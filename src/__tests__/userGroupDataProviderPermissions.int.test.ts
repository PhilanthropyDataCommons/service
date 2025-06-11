import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOrUpdateDataProvider,
	createOrUpdateUserGroupDataProviderPermission,
	loadUserGroupDataProviderPermission,
	removeUserGroupDataProviderPermission,
} from '../database';
import { expectTimestamp, getAuthContext, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { keycloakIdToString, Permission } from '../types';
import { NotFoundError } from '../errors';
import type { KeycloakId } from '../types';

const mockKeycloakOrganizationId = '123e4567-e89b-12d3-a456-426614174000';

describe('/userGroups/dataProviders/:dataProviderShortCode/permissions/:permission', () => {
	describe('PUT /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.send({})
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(401);
		});

		it('returns 400 if the organizationKeycloakId is not a valid keycloak organization ID', async () => {
			await request(app)
				.put(
					`/userGroups/notaguid/dataProviders/ExampleInc/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the data provider shortCode is not a valid short code', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/this is not valid/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/ExampleInc/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('creates and returns the new userGroup data provider permission when user has administrative credentials', async () => {
			const user = await loadTestUser();
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});

			const response = await request(app)
				.put(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				dataProviderShortCode: dataProvider.shortCode,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				keycloakOrganizationId:
					dataProvider.keycloakOrganizationId as KeycloakId,
			});
		});
	});

	describe('DELETE /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.send()
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send()
				.expect(401);
		});

		it('returns 400 if the organizationKeycloakId is not a valid keycloak organization ID', async () => {
			await request(app)
				.delete(
					`/userGroups/notaguid/dataProviders/ExampleInc/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the data provider shortCode is not a valid short code', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/this is not valid/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/ExampleInc/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(400);
		});

		it('returns 404 if the permission does not exist', async () => {
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('returns 404 if the permission had existed and previously been deleted', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await createOrUpdateUserGroupDataProviderPermission(
				db,
				testUserAuthContext,
				{
					keycloakOrganizationId:
						dataProvider.keycloakOrganizationId as KeycloakId,
					dataProviderShortCode: dataProvider.shortCode,
					permission: Permission.EDIT,
				},
			);
			await removeUserGroupDataProviderPermission(
				db,
				null,
				dataProvider.keycloakOrganizationId as KeycloakId,
				dataProvider.shortCode,
				Permission.EDIT,
			);
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(404);
		});

		it('deletes the userGroup data provider permission when the user has administrative credentials', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await createOrUpdateUserGroupDataProviderPermission(
				db,
				testUserAuthContext,
				{
					keycloakOrganizationId:
						dataProvider.keycloakOrganizationId as KeycloakId,
					dataProviderShortCode: dataProvider.shortCode,
					permission: Permission.EDIT,
				},
			);
			const permission = await loadUserGroupDataProviderPermission(
				db,
				null,
				dataProvider.keycloakOrganizationId as KeycloakId,
				dataProvider.shortCode,
				Permission.EDIT,
			);
			expect(permission).toEqual({
				dataProviderShortCode: dataProvider.shortCode,
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
				permission: Permission.EDIT,
				keycloakOrganizationId: mockKeycloakOrganizationId,
			});
			await request(app)
				.delete(
					`/userGroups/${keycloakIdToString(
						dataProvider.keycloakOrganizationId as KeycloakId,
					)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send()
				.expect(204);
			await expect(
				loadUserGroupDataProviderPermission(
					db,
					null,
					dataProvider.keycloakOrganizationId as KeycloakId,
					dataProvider.shortCode,
					Permission.EDIT,
				),
			).rejects.toThrow(NotFoundError);
		});
	});
});
