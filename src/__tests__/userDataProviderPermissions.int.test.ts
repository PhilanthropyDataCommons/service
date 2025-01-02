import request from 'supertest';
import { app } from '../app';
import {
	createOrUpdateDataProvider,
	createOrUpdateUserDataProviderPermission,
	loadSystemUser,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { keycloakIdToString, Permission } from '../types';

describe('/users/dataProviders/:dataProviderShortcode/permissions/:permission', () => {
	describe('PUT /', () => {
		it('returns 401 if the request lacks authentication', async () => {
			const user = await loadTestUser();
			const dataProvider = await createOrUpdateDataProvider({
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.send({})
				.expect(401);
		});

		it('returns 401 if the authenticated user lacks permission', async () => {
			const user = await loadTestUser();
			const dataProvider = await createOrUpdateDataProvider({
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});

			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(401);
		});

		it('returns 400 if the userId is not a valid keycloak user ID', async () => {
			await request(app)
				.put(
					`/users/notaguid/dataProviders/ExampleInc/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the data provider ID is not a valid short code', async () => {
			const user = await loadTestUser();
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/dataProviders/this is not valid/permissions/${Permission.MANAGE}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('returns 400 if the permission is not a valid permission', async () => {
			const user = await loadTestUser();
			await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/dataProviders/ExampleInc/permissions/notAPermission`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
		});

		it('creates and returns the new user data provider permission when user has administrative credentials', async () => {
			const user = await loadTestUser();
			const dataProvider = await createOrUpdateDataProvider({
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});

			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				dataProviderShortCode: dataProvider.shortCode,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: user.keycloakUserId,
			});
		});

		it('creates and returns the new user data provider permission when user has permission to manage the data provider', async () => {
			const user = await loadTestUser();
			const dataProvider = await createOrUpdateDataProvider({
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserDataProviderPermission({
				userKeycloakUserId: user.keycloakUserId,
				dataProviderShortCode: dataProvider.shortCode,
				permission: Permission.MANAGE,
				createdBy: user.keycloakUserId,
			});

			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.EDIT}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				dataProviderShortCode: dataProvider.shortCode,
				createdAt: expectTimestamp,
				createdBy: user.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: user.keycloakUserId,
			});
		});

		it('does not update `createdBy`, but returns the user data provider permission when user has permission to manage the data provider', async () => {
			const user = await loadTestUser();
			const systemUser = await loadSystemUser();
			const dataProvider = await createOrUpdateDataProvider({
				shortCode: 'ExampleInc',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserDataProviderPermission({
				userKeycloakUserId: user.keycloakUserId,
				dataProviderShortCode: dataProvider.shortCode,
				permission: Permission.MANAGE,
				createdBy: systemUser.keycloakUserId,
			});

			const response = await request(app)
				.put(
					`/users/${keycloakIdToString(user.keycloakUserId)}/dataProviders/${dataProvider.shortCode}/permissions/${Permission.MANAGE}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);
			expect(response.body).toEqual({
				dataProviderShortCode: dataProvider.shortCode,
				createdAt: expectTimestamp,
				createdBy: systemUser.keycloakUserId,
				permission: Permission.MANAGE,
				userKeycloakUserId: user.keycloakUserId,
			});
		});
	});
});
