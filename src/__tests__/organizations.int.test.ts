import request from 'supertest';
import { app } from '../app';
import { db, createPermissionGrant, loadSystemUser } from '../database';
import { expectArray } from '../test/asymettricMatchers';
import {
	createTestChangemaker,
	createTestDataProvider,
	createTestFunder,
} from '../test/factories';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
	mockOrgId,
} from '../test/mockJwt';
import {
	keycloakIdToString,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
	stringToKeycloakId,
} from '../types';
import { getAuthContext, getTestAuthContext } from '../test/utils';

const agent = request.agent(app);

describe('/organizations', () => {
	describe('GET /:keycloakOrganizationId', () => {
		it('requires authentication', async () => {
			await agent
				.get('/organizations/58710347-18ec-4600-b9d9-a06c28c3304a')
				.expect(401);
		});

		it('returns changemaker, data provider, and funder selected by keycloak org id for admins', async () => {
			const keycloakOrganizationId = stringToKeycloakId(
				'bde830f0-d590-467a-8431-cdf9d6af1b87',
			);

			// Unlinked entities (should not be returned)
			await createTestChangemaker(db, null);
			await createTestDataProvider(db, null);
			await createTestFunder(db, null);

			// Expected entities (linked to target keycloakOrganizationId)
			const expectedChangemaker = await createTestChangemaker(db, null, {
				keycloakOrganizationId,
			});
			const expectedDataProvider = await createTestDataProvider(db, null, {
				keycloakOrganizationId,
			});
			const expectedFunder = await createTestFunder(db, null, {
				keycloakOrganizationId,
			});

			// Decoy entities (linked to different keycloakOrganizationIds)
			await createTestChangemaker(db, null, {
				keycloakOrganizationId: 'fa32e21e-e471-4d28-b101-7788c611aa04',
			});
			await createTestDataProvider(db, null, {
				keycloakOrganizationId: '865cb652-a1d2-418a-8c89-015c0d6e4676',
			});
			await createTestFunder(db, null, {
				keycloakOrganizationId: '75b4198f-dd88-4a6c-8259-fe4d725af125',
			});

			const response = await agent
				.get(`/organizations/${keycloakIdToString(keycloakOrganizationId)}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toStrictEqual({
				// A shallow changemaker is expected, not a deep one.
				changemaker: {
					taxId: expectedChangemaker.taxId,
					name: expectedChangemaker.name,
					createdAt: expectedChangemaker.createdAt,
					id: expectedChangemaker.id,
					keycloakOrganizationId: expectedChangemaker.keycloakOrganizationId,
				},
				data_provider: expectedDataProvider,
				funder: expectedFunder,
			});
		});

		it('returns only the funder on which I have view permission', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const keycloakOrganizationId = 'b5465297-d63a-4371-8054-f94d95f1aace';

			await createTestFunder(db, null, {
				name: 'Unlinked funder one.',
				shortCode: 'unlinkedfunderone',
			});
			const expectedFunder = await createTestFunder(db, null, {
				name: 'Funderdome',
				shortCode: 'funderdome',
				keycloakOrganizationId,
			});
			const authContext = await getTestAuthContext(false);
			// Grant myself view access to this organization
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: authContext.user.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: expectedFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const keycloakOrganizationIdLackingPerm =
				'75b4198f-dd88-4a6c-8259-fe4d725af125';
			await createTestFunder(db, null, {
				name: 'Decoy funder, unexpected because I lack view access to this org',
				shortCode: 'decoyfunderunexpected',
				keycloakOrganizationId: keycloakOrganizationIdLackingPerm,
			});

			// I have view access to this org
			const response = await agent
				.get(`/organizations/${keycloakOrganizationId}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				changemaker: null,
				data_provider: null,
				funder: expectedFunder,
			});
			// But I lack view access to this org
			await agent
				.get(`/organizations/${keycloakOrganizationIdLackingPerm}`)
				.set(authHeader)
				.expect(404);
		});

		it('returns only the data provider on which my org has view permission', async () => {
			const keycloakOrganizationId = stringToKeycloakId(mockOrgId);

			await createTestDataProvider(db, null, {
				name: 'Unlinked Data Provider one.',
				shortCode: 'unlinkeddataproviderone',
			});
			const expectedDataProvider = await createTestDataProvider(db, null, {
				name: 'Dapper Data Provider',
				shortCode: 'dapperdataprovider',
				keycloakOrganizationId,
			});
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			// Grant my organization of which I'm a member view access to this data provider
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER_GROUP,
				granteeKeycloakOrganizationId: keycloakOrganizationId,
				contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
				dataProviderShortCode: expectedDataProvider.shortCode,
				scope: [PermissionGrantEntityType.DATA_PROVIDER],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const keycloakOrganizationIdLackingPerm =
				'24fea6aa-f1c5-4594-8bdc-b1789d4d0840';
			await createTestDataProvider(db, null, {
				name: 'Decoy Data Provider, unexpected because I lack view access to this org',
				shortCode: 'decoydataproviderunexpected',
				keycloakOrganizationId: keycloakOrganizationIdLackingPerm,
			});

			// I have view access to this org via my own org being granted view access
			const response = await agent
				.get(`/organizations/${keycloakIdToString(keycloakOrganizationId)}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				changemaker: null,
				data_provider: expectedDataProvider,
				funder: null,
			});
			// But I lack view access to this org
			await agent
				.get(`/organizations/${keycloakOrganizationIdLackingPerm}`)
				.set(authHeader)
				.expect(404);
		});

		it('returns 400 bad request when id is a letter', async () => {
			const result = await agent
				.get('/organizations/a')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when id is not found', async () => {
			await agent
				.get('/organizations/34643bb4-8a4e-46f3-be1a-b679876a506a')
				.set(authHeader)
				.expect(404);
		});
	});
});
