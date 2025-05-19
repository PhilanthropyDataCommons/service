import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../app';
import {
	db,
	createChangemaker,
	createOrUpdateDataProvider,
	createOrUpdateFunder,
	createOrUpdateUserChangemakerPermission,
	createOrUpdateUserDataProviderPermission,
	createOrUpdateUserFunderPermission,
	createOrUpdateUser,
	loadSystemUser,
	loadTableMetrics,
	removeUserChangemakerPermission,
	createOpportunity,
	createOrUpdateUserOpportunityPermission,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import {
	keycloakIdToString,
	stringToKeycloakId,
	Permission,
	OpportunityPermission,
} from '../types';

const createAdditionalTestUser = async () =>
	await createOrUpdateUser(db, null, {
		keycloakUserId: stringToKeycloakId('123e4567-e89b-12d3-a456-426614174000'),
	});

describe('/users', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/users').expect(401);
		});

		it('returns the user associated with the requesting user', async () => {
			const testUser = await loadTestUser();
			await createAdditionalTestUser();
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get('/users')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [
					{
						keycloakUserId: testUser.keycloakUserId,
						permissions: {
							changemaker: {},
							dataProvider: {},
							funder: {},
							opportunity: {},
						},
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns the permissions associated with a user', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const dataProvider = await createOrUpdateDataProvider(db, null, {
				name: 'Test Provider',
				shortCode: 'testProvider',
				keycloakOrganizationId: null,
			});
			const funder = await createOrUpdateFunder(db, null, {
				name: 'Test Funder',
				shortCode: 'testFunder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const changemaker = await createChangemaker(db, null, {
				name: 'Test Changemaker',
				taxId: '12-3456789',
				keycloakOrganizationId: null,
			});
			const opportunity = await createOpportunity(db, null, {
				title: 'Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			await createOrUpdateUserDataProviderPermission(
				db,
				systemUserAuthContext,
				{
					userKeycloakUserId: testUser.keycloakUserId,
					permission: Permission.MANAGE,
					dataProviderShortCode: dataProvider.shortCode,
				},
			);
			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				permission: Permission.EDIT,
				funderShortCode: funder.shortCode,
			});
			await createOrUpdateUserChangemakerPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				permission: Permission.VIEW,
				changemakerId: changemaker.id,
			});
			await createOrUpdateUserOpportunityPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				opportunityId: opportunity.id,
				opportunityPermission: OpportunityPermission.CREATE_PROPOSAL,
			});
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get('/users')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [
					{
						keycloakUserId: testUser.keycloakUserId,
						permissions: {
							changemaker: {
								[changemaker.id]: [Permission.VIEW],
							},
							dataProvider: {
								testProvider: [Permission.MANAGE],
							},
							funder: {
								testFunder: [Permission.EDIT],
							},
							opportunity: {
								[opportunity.id]: [OpportunityPermission.CREATE_PROPOSAL],
							},
						},
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('does not return deleted permissions associated with a user', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const changemaker = await createChangemaker(db, null, {
				name: 'Test Changemaker',
				taxId: '12-3456789',
				keycloakOrganizationId: null,
			});
			await createOrUpdateUserChangemakerPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				permission: Permission.VIEW,
				changemakerId: changemaker.id,
			});
			await removeUserChangemakerPermission(
				db,
				null,
				testUser.keycloakUserId,
				changemaker.id,
				Permission.VIEW,
			);
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get('/users')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [
					{
						keycloakUserId: testUser.keycloakUserId,
						permissions: {
							changemaker: {},
							dataProvider: {},
							funder: {},
							opportunity: {},
						},
						createdAt: expectTimestamp(),
					},
				],
			});
		});

		it('returns all users when the user is an administrator', async () => {
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			const anotherUser = await createAdditionalTestUser();
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get('/users')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser, testUser, systemUser],
			});
		});

		it('returns a specific user when a keycloakUserId is provided', async () => {
			const anotherUser = await createAdditionalTestUser();
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get(
					`/users?keycloakUserId=${keycloakIdToString(anotherUser.keycloakUserId)}`,
				)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [anotherUser],
			});
		});

		it('returns 400 when an invalid keycloakUserId is provided', async () => {
			await request(app)
				.get(`/users?keycloakUserId=thisisnotauuid`)
				.set(authHeaderWithAdminRole)
				.expect(400);
		});

		it('returns according to pagination parameters', async () => {
			const uuids = Array.from(Array(20)).map(() => uuidv4());
			await uuids.reduce(async (p, uuid) => {
				await p;
				await createOrUpdateUser(db, null, {
					keycloakUserId: uuid,
				});
			}, Promise.resolve());
			const { count: userCount } = await loadTableMetrics('users');

			const response = await request(app)
				.get('/users')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: userCount,
				entries: [
					{
						keycloakUserId: uuids[14],
						permissions: {
							changemaker: {},
							dataProvider: {},
							funder: {},
							opportunity: {},
						},
						createdAt: expectTimestamp(),
					},
					{
						keycloakUserId: uuids[13],
						permissions: {
							changemaker: {},
							dataProvider: {},
							funder: {},
							opportunity: {},
						},
						createdAt: expectTimestamp(),
					},
					{
						keycloakUserId: uuids[12],
						permissions: {
							changemaker: {},
							dataProvider: {},
							funder: {},
							opportunity: {},
						},
						createdAt: expectTimestamp(),
					},
					{
						keycloakUserId: uuids[11],
						permissions: {
							changemaker: {},
							dataProvider: {},
							funder: {},
							opportunity: {},
						},
						createdAt: expectTimestamp(),
					},
					{
						keycloakUserId: uuids[10],
						permissions: {
							changemaker: {},
							dataProvider: {},
							funder: {},
							opportunity: {},
						},
						createdAt: expectTimestamp(),
					},
				],
			});
		});
	});
});
