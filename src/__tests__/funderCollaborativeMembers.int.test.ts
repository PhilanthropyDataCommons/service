import request from 'supertest';
import { app } from '../app';
import {
	db,
	createFunderCollaborativeMember,
	loadTableMetrics,
	createOrUpdateFunder,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

const agent = request.agent(app);

const createTestFunders = async ({
	theFundFund,
	theFoundationFoundation,
	theFundersWhoFund,
	theFundingFathers,
	theFunnyFunders,
	theFungibleFund,
}: {
	theFundFund: boolean;
	theFoundationFoundation: boolean;
	theFundersWhoFund: boolean;
	theFundingFathers: boolean;
	theFunnyFunders: boolean;
	theFungibleFund: boolean;
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
		shortCode: 'theFundersWhoFund',
		name: 'The Funders Who Fund',
		keycloakOrganizationId: null,
		isCollaborative: theFundersWhoFund,
	});
	await createOrUpdateFunder(db, null, {
		shortCode: 'theFundingFathers',
		name: 'The Funding Fathers',
		keycloakOrganizationId: null,
		isCollaborative: theFundingFathers,
	});
	await createOrUpdateFunder(db, null, {
		shortCode: 'theFunnyFunders',
		name: 'The Funny Funders',
		keycloakOrganizationId: null,
		isCollaborative: theFunnyFunders,
	});
	await createOrUpdateFunder(db, null, {
		shortCode: 'theFungibleFund',
		name: 'The Fungible Fund',
		keycloakOrganizationId: null,
		isCollaborative: theFungibleFund,
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
				theFoundationFoundation: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});
			await createFunderCollaborativeMember(db, testUserAuthContext, {
				funderCollaborativeShortCode: 'theFundFund',
				memberShortCode: 'theFoundationFoundation',
			});
			await createFunderCollaborativeMember(db, testUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberShortCode: 'theFundersWhoFund',
			});
			await createFunderCollaborativeMember(db, testUserAuthContext, {
				funderCollaborativeShortCode: 'theFundersWhoFund',
				memberShortCode: 'theFundingFathers',
			});
			const response = await agent
				.get('/funderCollaborativeMembers')
				.set(adminUserAuthHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						funderCollaborativeShortCode: 'theFundersWhoFund',
						memberShortCode: 'theFundingFathers',
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
					},
					{
						funderCollaborativeShortCode: 'theFoundationFoundation',
						memberShortCode: 'theFundersWhoFund',
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
				total: 3,
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
				theFoundationFoundation: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
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

		it('creates and returns exactly one funder collaborative member', async () => {
			const adminUser = await loadTestUser();
			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});
			const response = await agent
				.post('/funderCollaborativeMembers/theFundFund/theFoundationFoundation')
				.set(adminUserAuthHeader)
				.expect(201);
			expect(response.body).toMatchObject({
				funderCollaborativeShortCode: 'theFundFund',
				memberShortCode: 'theFoundationFoundation',
				createdAt: expectTimestamp(),
				createdBy: adminUser.keycloakUserId,
			});
		});

		it('returns 400 when the funder is not collaborative', async () => {
			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: false,
				theFundersWhoFund: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
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
				theFoundationFoundation: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
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
