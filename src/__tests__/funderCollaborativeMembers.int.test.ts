import request from 'supertest';
import { app } from '../app';
import {
	db,
	createFunderCollaborativeMember,
	loadTableMetrics,
	createOrUpdateFunder,
	createOrUpdateUserFunderPermission,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import { keycloakIdToString, Permission } from '../types';

const agent = request.agent(app);

const createTestFunders = async ({
	theFundFund,
	theFoundationFoundation,
	theFundingFathers,
}: {
	theFundFund: boolean;
	theFoundationFoundation: boolean;
	theFundingFathers: boolean;
}) => {
	await createOrUpdateFunder(db, null, {
		shortCode: 'theFundFund',
		name: 'The Fund Fund',
		keycloakOrganizationId: null,
		isCollaborative: theFundFund,
	});
	await createOrUpdateFunder(db, null, {
		shortCode: 'theFoundationFoundation',
		name: 'The Foundation Foundation',
		keycloakOrganizationId: null,
		isCollaborative: theFoundationFoundation,
	});
	await createOrUpdateFunder(db, null, {
		shortCode: 'theFundingFathers',
		name: 'The Funding Fathers',
		keycloakOrganizationId: null,
		isCollaborative: theFundingFathers,
	});
};

describe('/funderCollaborativeMembers', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/funderCollaborativeMembers').expect(401);
		});

		it('returns all funder collaborative members present in the database', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);

			await createTestFunders({
				theFundFund: true,
				theFoundationFoundation: true,
				theFundingFathers: true,
			});
			await createFunderCollaborativeMember(db, testUserAuthContext, {
				funderCollaborativeShortCode: 'theFundFund',
				memberShortCode: 'theFoundationFoundation',
			});
			await createFunderCollaborativeMember(db, testUserAuthContext, {
				funderCollaborativeShortCode: 'theFundFund',
				memberShortCode: 'theFundingFathers',
			});
			const response = await agent
				.get('/funderCollaborativeMembers')
				.set(adminUserAuthHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						funderCollaborativeShortCode: 'theFundFund',
						memberShortCode: 'theFundingFathers',
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
					},
					{
						funderCollaborativeShortCode: 'theFundFund',
						memberShortCode: 'theFoundationFoundation',
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
					},
				],
				total: 2,
			});
		});
	});

	describe('GET /:funderCollaborativeShortCode/:memberShortCode', () => {
		it('requires authentication', async () => {
			await agent
				.get('/funderCollaborativeMembers/theFundFund/theFoundationFoundation')
				.expect(401);
		});

		it('returns exactly one funder collaborative member selected by short code', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunders({
				theFundFund: true,
				theFoundationFoundation: true,
				theFundingFathers: true,
			});
			await createFunderCollaborativeMember(db, testUserAuthContext, {
				funderCollaborativeShortCode: 'theFundFund',
				memberShortCode: 'theFoundationFoundation',
			});
			const response = await agent
				.get('/funderCollaborativeMembers/theFundFund/theFoundationFoundation')
				.set(authHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				funderCollaborativeShortCode: 'theFundFund',
				memberShortCode: 'theFoundationFoundation',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
		});
		it('throws a 404 when the funder collaborative member does not exist', async () => {
			const response = await agent
				.get('/funderCollaborativeMembers/theFundFund/theFoundationFoundation')
				.set(authHeader)
				.expect(404);
			expect(response.body).toMatchObject({
				name: 'NotFoundError',
				details: expectArray(),
			});
		});
	});
	describe('POST /:funderCollaborativeShortCode/:memberShortCode', () => {
		it('requires authentication', async () => {
			await agent
				.post('/funderCollaborativeMembers/theFundFund/theFoundationFoundation')
				.expect(401);
		});

		it('requires administrator role', async () => {
			await agent
				.post('/funderCollaborativeMembers/theFundFund/theFoundationFoundation')
				.set(authHeader)
				.expect(401);
		});

		it('creates and returns exactly one funder collaborative member, which gives the user permission to manage the collaborative funder', async () => {
			const adminUser = await loadTestUser();
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunders({
				theFundFund: true,
				theFoundationFoundation: true,
				theFundingFathers: true,
			});

			await createOrUpdateUserFunderPermission(db, testUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: 'theFundFund',
				permission: Permission.MANAGE,
			});

			const postFunderCollaborativeMemberResponse = await agent
				.post('/funderCollaborativeMembers/theFoundationFoundation/theFundFund')
				.set(adminUserAuthHeader)
				.expect(201);

			expect(postFunderCollaborativeMemberResponse.body).toMatchObject({
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberShortCode: 'theFundFund',
				createdAt: expectTimestamp(),
				createdBy: adminUser.keycloakUserId,
			});

			const putUserFunderPermissionResponse = await request(app)
				.put(
					`/users/${keycloakIdToString(testUser.keycloakUserId)}/funders/theFoundationFoundation/permissions/${Permission.EDIT}`,
				)
				.set(authHeader)
				.send({})
				.expect(201);

			expect(putUserFunderPermissionResponse.body).toEqual({
				funderShortCode: 'theFoundationFoundation',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
				permission: Permission.EDIT,
				userKeycloakUserId: testUser.keycloakUserId,
			});
		});

		it('returns 400 when the funder is not collaborative', async () => {
			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: false,
				theFundingFathers: false,
			});
			const response = await agent
				.post('/funderCollaborativeMembers/theFundFund/theFoundationFoundation')
				.set(adminUserAuthHeader)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});

	describe('DELETE /:funderCollaborativeShortCode/:memberShortCode', () => {
		it('requires authentication', async () => {
			await agent
				.delete(
					'/funderCollaborativeMembers/theFundFund/theFoundationFoundation',
				)
				.expect(401);
		});

		it('requires administrator role', async () => {
			await agent
				.delete(
					'/funderCollaborativeMembers/theFundFund/theFoundationFoundation',
				)
				.set(authHeader)
				.expect(401);
		});

		it('deletes and returns exactly one funder collaborative member', async () => {
			const adminUser = await loadTestUser();
			const adminUserAuthContext = getAuthContext(adminUser);
			await createTestFunders({
				theFundFund: true,
				theFoundationFoundation: true,
				theFundingFathers: true,
			});
			await createFunderCollaborativeMember(db, adminUserAuthContext, {
				funderCollaborativeShortCode: 'theFundFund',
				memberShortCode: 'theFoundationFoundation',
			});
			const before = await loadTableMetrics('funder_collaborative_members');
			const response = await agent
				.delete(
					'/funderCollaborativeMembers/theFundFund/theFoundationFoundation',
				)
				.set(adminUserAuthHeader)
				.expect(200);
			const after = await loadTableMetrics('funder_collaborative_members');
			expect(response.body).toMatchObject({
				funderCollaborativeShortCode: 'theFundFund',
				memberShortCode: 'theFoundationFoundation',
				createdAt: expectTimestamp(),
				createdBy: adminUser.keycloakUserId,
			});
			expect(before.count).toEqual(1);
			expect(after.count).toEqual(0);
		});
		it('throws a 404 when the funder collaborative member does not exist', async () => {
			const response = await agent
				.delete(
					'/funderCollaborativeMembers/theFundFund/theFoundationFoundation',
				)
				.set(adminUserAuthHeader)
				.expect(404);
			expect(response.body).toMatchObject({
				name: 'NotFoundError',
				details: expectArray(),
			});
		});
	});
});
