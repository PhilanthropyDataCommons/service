import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOrUpdateFunder,
	loadFunder,
	loadTableMetrics,
	loadSystemFunder,
	createOrUpdateFunderCollaborativeMember,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';

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

const agent = request.agent(app);

describe('/funders', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/funders').expect(401);
		});

		it('returns all funders present in the database', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});

			const response = await agent.get('/funders').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						shortCode: 'theFoundationFoundation',
						createdAt: expectTimestamp(),
						name: 'The Foundation Foundation',
						keycloakOrganizationId: null,
						isCollaborative: false,
					},
					{
						shortCode: 'theFundFund',
						createdAt: expectTimestamp(),
						name: 'The Fund Fund',
						keycloakOrganizationId: null,
						isCollaborative: false,
					},
					systemFunder,
				],
				total: 3,
			});
		});
	});

	describe('GET /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.get('/funders/foo').expect(401);
		});

		it('returns exactly one funder selected by short code', async () => {
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
				keycloakOrganizationId: '0de87edc-be40-11ef-8249-0312f1b87538',
				isCollaborative: false,
			});

			const response = await agent
				.get(`/funders/theFoundationFoundation`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				shortCode: 'theFoundationFoundation',
				createdAt: expectTimestamp(),
				name: 'The Foundation Foundation',
				keycloakOrganizationId: '0de87edc-be40-11ef-8249-0312f1b87538',
				isCollaborative: false,
			});
		});

		it('returns 404 when short code is not found', async () => {
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			await agent.get('/funders/foo').set(authHeader).expect(404);
		});
	});

	describe('PUT /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.put('/funders/foo').expect(401);
		});

		it('requires administrator role', async () => {
			await agent.put('/funders/foo').set(authHeader).expect(401);
		});

		it('creates and returns exactly one funder', async () => {
			const before = await loadTableMetrics('funders');
			const result = await agent
				.put('/funders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆', isCollaborative: false })
				.expect(201);
			const after = await loadTableMetrics('funders');
			expect(result.body).toMatchObject({
				shortCode: 'firework',
				name: '🎆',
				createdAt: expectTimestamp(),
				isCollaborative: false,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('allows all alphanumeric, _, and - in the short name', async () => {
			await agent
				.put('/funders/Firework_-foo42')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆', isCollaborative: false })
				.expect(201);
		});

		it('updates an existing funder and no others', async () => {
			await createOrUpdateFunder(db, null, {
				shortCode: 'firework',
				name: 'boring text-based firework',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const anotherFunderBefore = await createOrUpdateFunder(db, null, {
				shortCode: 'anotherFirework',
				name: 'another boring text based firework',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const before = await loadTableMetrics('data_providers');
			const result = await agent
				.put('/funders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆', isCollaborative: false })
				.expect(201);
			const after = await loadTableMetrics('data_providers');
			const anotherFunderAfter = await loadFunder(db, null, 'anotherFirework');
			expect(result.body).toStrictEqual({
				shortCode: 'firework',
				name: '🎆',
				keycloakOrganizationId: null,
				createdAt: expectTimestamp(),
				isCollaborative: false,
			});
			expect(after.count).toEqual(before.count);
			expect(anotherFunderAfter).toEqual(anotherFunderBefore);
		});

		it('returns 400 bad request when no name is sent', async () => {
			const result = await agent
				.put('/funders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ noTitleHere: '👎' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when disallowed characters are included', async () => {
			const before = await loadTableMetrics('funders');
			await agent
				.put('/funders/my funder')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(400);
			const after = await loadTableMetrics('funders');
			expect(after.count).toEqual(before.count);
		});
	});
	describe('/funders/:funderShortCode/members', () => {
		describe('GET /', () => {
			it('requires authentication', async () => {
				await agent.get('/funders/foo/members').expect(401);
			});

			it('throws a 400 error if the funder short code is invalid', async () => {
				await agent
					.get('/funders/!!!!!!!/members')
					.set(adminUserAuthHeader)
					.expect(400);
			});

			it('returns all members of a collaborative funder', async () => {
				const testUser = await loadTestUser();
				const testUserAuthContext = getAuthContext(testUser);

				await createTestFunders({
					theFundFund: true,
					theFoundationFoundation: false,
					theFundersWhoFund: false,
					theFundingFathers: false,
					theFunnyFunders: false,
					theFungibleFund: false,
				});

				await createOrUpdateFunderCollaborativeMember(db, testUserAuthContext, {
					funderCollaborativeShortCode: 'theFundFund',
					memberFunderShortCode: 'theFoundationFoundation',
				});
				await createOrUpdateFunderCollaborativeMember(db, testUserAuthContext, {
					funderCollaborativeShortCode: 'theFundFund',
					memberFunderShortCode: 'theFundersWhoFund',
				});
				await createOrUpdateFunderCollaborativeMember(db, testUserAuthContext, {
					funderCollaborativeShortCode: 'theFundFund',
					memberFunderShortCode: 'theFundingFathers',
				});
				const response = await agent
					.get('/funders/theFundFund/members')
					.set(adminUserAuthHeader)
					.expect(200);
				expect(response.body).toEqual({
					entries: [
						{
							funderCollaborativeShortCode: 'theFundFund',
							memberFunderShortCode: 'theFundingFathers',
							createdAt: expectTimestamp(),
							createdBy: testUser.keycloakUserId,
						},
						{
							funderCollaborativeShortCode: 'theFundFund',
							memberFunderShortCode: 'theFundersWhoFund',
							createdAt: expectTimestamp(),
							createdBy: testUser.keycloakUserId,
						},
						{
							funderCollaborativeShortCode: 'theFundFund',
							memberFunderShortCode: 'theFoundationFoundation',
							createdAt: expectTimestamp(),
							createdBy: testUser.keycloakUserId,
						},
					],
					total: 3,
				});
			});
		});

		describe('GET /funders/:funderShortCode/members/:memberFunderShortCode', () => {
			it('requires authentication', async () => {
				await agent
					.get('/funders/theFundFund/members/theFoundationFoundation')
					.expect(401);
			});

			it('throws a 400 error if the funder short code is invalid', async () => {
				await agent
					.get('/funders/!!!!!!!/members/theFoundationFoundation')
					.set(adminUserAuthHeader)
					.expect(400);
			});

			it('throws a 400 error if the member funder short code is invalid', async () => {
				await agent
					.get('/funders/theFundFund/members/!!!!!!!')
					.set(adminUserAuthHeader)
					.expect(400);
			});

			it('requires MANAGE permission on the funder', async () => {
				await createTestFunders({
					theFundFund: true,
					theFoundationFoundation: false,
					theFundersWhoFund: false,
					theFundingFathers: false,
					theFunnyFunders: false,
					theFungibleFund: false,
				});
				const result = await agent
					.get('/funders/theFundFund/members/theFoundationFoundation')
					.set(authHeader)
					.expect(401);
				expect(result.body).toMatchObject({
					message:
						'Authenticated user does not have permission to perform this action.',
					details: expectArray(),
				});
			});

			it('returns exactly one funder collaborative member selected by short code', async () => {
				const testUser = await loadTestUser();
				const testUserAuthContext = getAuthContext(testUser);
				await createTestFunders({
					theFundFund: true,
					theFoundationFoundation: false,
					theFundersWhoFund: false,
					theFundingFathers: false,
					theFunnyFunders: false,
					theFungibleFund: false,
				});
				await createOrUpdateUserFunderPermission(db, testUserAuthContext, {
					userKeycloakUserId: testUser.keycloakUserId,
					funderShortCode: 'theFundFund',
					permission: Permission.MANAGE,
				});
				await createOrUpdateFunderCollaborativeMember(db, testUserAuthContext, {
					funderCollaborativeShortCode: 'theFundFund',
					memberFunderShortCode: 'theFoundationFoundation',
				});

				const response = await agent
					.get('/funders/theFundFund/members/theFoundationFoundation')
					.set(authHeader)
					.expect(200);

				expect(response.body).toMatchObject({
					funderCollaborativeShortCode: 'theFundFund',
					memberFunderShortCode: 'theFoundationFoundation',
					createdAt: expectTimestamp(),
					createdBy: testUser.keycloakUserId,
				});
			});
			it('throws a 404 when the funder collaborative member does not exist', async () => {
				const testUser = await loadTestUser();
				const testUserAuthContext = getAuthContext(testUser);
				await createTestFunders({
					theFundFund: true,
					theFoundationFoundation: false,
					theFundersWhoFund: false,
					theFundingFathers: false,
					theFunnyFunders: false,
					theFungibleFund: false,
				});
				await createOrUpdateUserFunderPermission(db, testUserAuthContext, {
					userKeycloakUserId: testUser.keycloakUserId,
					funderShortCode: 'theFundFund',
					permission: Permission.MANAGE,
				});
				const response = await agent
					.get('/funders/theFundFund/members/theFoundationFoundation')
					.set(authHeader)
					.expect(404);
				expect(response.body).toMatchObject({
					name: 'NotFoundError',
					details: expectArray(),
				});
			});
		});
		describe('POST /funders/:funderShortCode/members/:memberFunderShortCode', () => {
			it('requires authentication', async () => {
				await agent
					.post('/funders/theFundFund/members/theFoundationFoundation')
					.expect(401);
			});

			it('requires administrator role', async () => {
				await agent
					.post('/funders/theFundFund/members/theFoundationFoundation')
					.set(authHeader)
					.expect(401);
			});

			it('throws a 400 error if the funder short code is invalid', async () => {
				await agent
					.post('/funders/!!!!!!!/members/theFoundationFoundation')
					.set(adminUserAuthHeader)
					.expect(400);
			});

			it('throws a 400 error if the member funder short code is invalid', async () => {
				await agent
					.post('/funders/theFundFund/members/!!!!!!!')
					.set(adminUserAuthHeader)
					.expect(400);
			});

			it('creates and returns exactly one funder collaborative member', async () => {
				const adminUser = await loadTestUser();
				await createTestFunders({
					theFundFund: true,
					theFoundationFoundation: false,
					theFundersWhoFund: false,
					theFundingFathers: false,
					theFunnyFunders: false,
					theFungibleFund: false,
				});
				const response = await agent
					.post('/funders/theFundFund/members/theFoundationFoundation')
					.set(adminUserAuthHeader)
					.expect(201);
				expect(response.body).toMatchObject({
					funderCollaborativeShortCode: 'theFundFund',
					memberFunderShortCode: 'theFoundationFoundation',
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
					.post('/funders/theFundFund/members/theFoundationFoundation')
					.set(adminUserAuthHeader)
					.expect(400);
				expect(response.body).toMatchObject({
					name: 'DatabaseError',
					details: expectArray(),
				});
			});
		});

		describe('DELETE /funders/:funderShortCode/members/:memberFunderShortCode', () => {
			it('requires authentication', async () => {
				await agent
					.delete('/funders/theFundFund/members/theFoundationFoundation')
					.expect(401);
			});

			it('requires administrator role', async () => {
				await agent
					.delete('/funders/theFundFund/members/theFoundationFoundation')
					.set(authHeader)
					.expect(401);
			});

			it('throws a 400 error if the funder short code is invalid', async () => {
				await agent
					.delete('/funders/!!!!!!!/members/theFoundationFoundation')
					.set(adminUserAuthHeader)
					.expect(400);
			});

			it('throws a 400 error if the member funder short code is invalid', async () => {
				await agent
					.delete('/funders/theFundFund/members/!!!!!!!')
					.set(adminUserAuthHeader)
					.expect(400);
			});

			it('deletes and returns exactly one funder collaborative member', async () => {
				const adminUser = await loadTestUser();
				const adminUserAuthContext = getAuthContext(adminUser);

				await createTestFunders({
					theFundFund: true,
					theFoundationFoundation: false,
					theFundersWhoFund: false,
					theFundingFathers: false,
					theFunnyFunders: false,
					theFungibleFund: false,
				});

				await createOrUpdateFunderCollaborativeMember(
					db,
					adminUserAuthContext,
					{
						funderCollaborativeShortCode: 'theFundFund',
						memberFunderShortCode: 'theFoundationFoundation',
					},
				);
				const response = await agent
					.delete('/funders/theFundFund/members/theFoundationFoundation')
					.set(adminUserAuthHeader)
					.expect(200);
				expect(response.body).toMatchObject({
					funderCollaborativeShortCode: 'theFundFund',
					memberFunderShortCode: 'theFoundationFoundation',
					createdAt: expectTimestamp(),
					createdBy: adminUser.keycloakUserId,
				});
				const getResponse = await agent
					.get('/funders/theFundFund/members/theFoundationFoundation')
					.set(adminUserAuthHeader)
					.expect(404);
				expect(getResponse.body).toMatchObject({
					name: 'NotFoundError',
					details: expectArray(),
				});
			});
			it('throws a 404 when the funder collaborative member does not exist', async () => {
				const response = await agent
					.delete('/funders/theFundFund/members/theFoundationFoundation')
					.set(adminUserAuthHeader)
					.expect(404);
				expect(response.body).toMatchObject({
					name: 'NotFoundError',
					details: expectArray(),
				});
			});
		});
	});
});
