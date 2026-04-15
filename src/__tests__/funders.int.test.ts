import request from 'supertest';
import { app } from '../app';
import {
	getDatabase,
	loadFunder,
	loadTableMetrics,
	loadSystemFunder,
	createOrUpdateFunderCollaborativeMember,
	loadSystemUser,
	createFunderCollaborativeInvitation,
	loadFunderCollaborativeMember,
	createPermissionGrant,
} from '../database';
import {
	getAuthContext,
	loadTestUser,
	getTestUserKeycloakUserId,
} from '../test/utils';
import {
	expectArray,
	expectArrayContaining,
	expectObjectContaining,
	expectTimestamp,
} from '../test/asymettricMatchers';
import { createTestFunder } from '../test/factories';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	FunderCollaborativeInvitationStatus,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';
import type { TinyPg } from 'tinypg';
import type { AuthContext } from '../types';

const createTestFunders = async (
	db: TinyPg,
	authContext: AuthContext,
	{
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
	},
) => {
	await createTestFunder(db, authContext, {
		shortCode: 'theFundFund',
		name: 'The Fund Fund',
		isCollaborative: theFundFund,
	});
	await createTestFunder(db, authContext, {
		shortCode: 'theFoundationFoundation',
		name: 'The Foundation Foundation',
		isCollaborative: theFoundationFoundation,
	});
	await createTestFunder(db, authContext, {
		shortCode: 'theFundersWhoFund',
		name: 'The Funders Who Fund',
		isCollaborative: theFundersWhoFund,
	});
	await createTestFunder(db, authContext, {
		shortCode: 'theFundingFathers',
		name: 'The Funding Fathers',
		isCollaborative: theFundingFathers,
	});
	await createTestFunder(db, authContext, {
		shortCode: 'theFunnyFunders',
		name: 'The Funny Funders',
		isCollaborative: theFunnyFunders,
	});
	await createTestFunder(db, authContext, {
		shortCode: 'theFungibleFund',
		name: 'The Fungible Fund',
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
			const db = getDatabase();
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
			});

			const response = await agent.get('/funders').set(authHeader).expect(200);
			expect(response.body).toEqual({
				entries: [
					{
						shortCode: 'theFoundationFoundation',
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
						name: 'The Foundation Foundation',
						keycloakOrganizationId: null,
						isCollaborative: false,
					},
					{
						shortCode: 'theFundFund',
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
						name: 'The Fund Fund',
						keycloakOrganizationId: null,
						isCollaborative: false,
					},
					systemFunder,
				],
				total: 3,
			});
		});

		it('returns a subset of funders when search is provided', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'greenFund',
				name: 'Green Environment Fund',
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'techGrants',
				name: 'Tech Innovation Grants',
			});

			const response = await agent
				.get('/funders?_content=environment')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						shortCode: 'greenFund',
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
						name: 'Green Environment Fund',
						keycloakOrganizationId: null,
						isCollaborative: false,
					},
				],
			});
		});

		it('returns no funders when search does not match', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'greenFund',
				name: 'Green Environment Fund',
			});

			const response = await agent
				.get('/funders?_content=xyznonexistent')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 0,
				entries: [],
			});
		});

		it('returns only collaborative funders when isCollaborative=true is provided', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'collabA',
				name: 'Collaborative A',
				isCollaborative: true,
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'collabB',
				name: 'Collaborative B',
				isCollaborative: true,
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'soloFund',
				name: 'Solo Fund',
				isCollaborative: false,
			});

			const response = await agent
				.get('/funders?isCollaborative=true')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: expectArrayContaining([
					expectObjectContaining({
						shortCode: 'collabA',
						isCollaborative: true,
					}),
					expectObjectContaining({
						shortCode: 'collabB',
						isCollaborative: true,
					}),
				]),
			});
		});

		it('returns only non-collaborative funders when isCollaborative=false is provided', async () => {
			const db = getDatabase();
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'collabA',
				name: 'Collaborative A',
				isCollaborative: true,
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'soloFund',
				name: 'Solo Fund',
				isCollaborative: false,
			});

			const response = await agent
				.get('/funders?isCollaborative=false')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: expectArrayContaining([
					expectObjectContaining({
						shortCode: 'soloFund',
						isCollaborative: false,
					}),
					expectObjectContaining({
						shortCode: systemFunder.shortCode,
						isCollaborative: false,
					}),
				]),
			});
		});

		it('combines isCollaborative and search filters', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'greenCollab',
				name: 'Green Collaborative',
				isCollaborative: true,
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'greenFund',
				name: 'Green Fund',
				isCollaborative: false,
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'climateCollab',
				name: 'Climate Collaborative',
				isCollaborative: true,
			});

			const response = await agent
				.get('/funders?isCollaborative=true&_content=green')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					expectObjectContaining({
						shortCode: 'greenCollab',
						isCollaborative: true,
					}),
				],
			});
		});

		it('returns a collaborative funder when search matches a member funder name', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const collaborative = await createTestFunder(db, testUserAuthContext, {
				shortCode: 'climateCollab',
				name: 'Climate Collaborative',
				isCollaborative: true,
			});
			const memberFunder = await createTestFunder(db, testUserAuthContext, {
				shortCode: 'solarFund',
				name: 'Solar Energy Fund',
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'unrelatedFund',
				name: 'Unrelated Fund',
			});
			await createOrUpdateFunderCollaborativeMember(db, systemUserAuthContext, {
				funderCollaborativeShortCode: collaborative.shortCode,
				memberFunderShortCode: memberFunder.shortCode,
			});

			const response = await agent
				.get('/funders?_content=solar')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: expectArrayContaining([
					expectObjectContaining({
						shortCode: 'solarFund',
						name: 'Solar Energy Fund',
					}),
					expectObjectContaining({
						shortCode: 'climateCollab',
						name: 'Climate Collaborative',
					}),
				]),
			});
		});
	});

	describe('GET /:shortCode', () => {
		it('requires authentication', async () => {
			await agent.get('/funders/foo').expect(401);
		});

		it('returns exactly one funder selected by short code', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
				keycloakOrganizationId: '0de87edc-be40-11ef-8249-0312f1b87538',
			});

			const response = await agent
				.get(`/funders/theFoundationFoundation`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toStrictEqual({
				shortCode: 'theFoundationFoundation',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
				name: 'The Foundation Foundation',
				keycloakOrganizationId: '0de87edc-be40-11ef-8249-0312f1b87538',
				isCollaborative: false,
			});
		});

		it('returns 404 when short code is not found', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
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
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'funders');
			const result = await agent
				.put('/funders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆', isCollaborative: false })
				.expect(201);
			const after = await loadTableMetrics(db, 'funders');
			expect(result.body).toMatchObject({
				shortCode: 'firework',
				name: '🎆',
				createdAt: expectTimestamp(),
				createdBy: getTestUserKeycloakUserId(),
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
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'firework',
				name: 'boring text-based firework',
			});
			const anotherFunderBefore = await createTestFunder(
				db,
				testUserAuthContext,
				{
					shortCode: 'anotherFirework',
					name: 'another boring text based firework',
				},
			);
			const before = await loadTableMetrics(db, 'data_providers');
			const result = await agent
				.put('/funders/firework')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆', isCollaborative: false })
				.expect(201);
			const after = await loadTableMetrics(db, 'data_providers');
			const anotherFunderAfter = await loadFunder(db, null, 'anotherFirework');
			expect(result.body).toStrictEqual({
				shortCode: 'firework',
				name: '🎆',
				keycloakOrganizationId: null,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
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
			const db = getDatabase();
			const before = await loadTableMetrics(db, 'funders');
			await agent
				.put('/funders/my funder')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ name: '🎆' })
				.expect(400);
			const after = await loadTableMetrics(db, 'funders');
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
				const db = getDatabase();
				const testUser = await loadTestUser(db);
				const testUserAuthContext = getAuthContext(testUser);
				await createTestFunders(db, testUserAuthContext, {
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
				const db = getDatabase();
				const testUser = await loadTestUser(db);
				const testUserAuthContext = getAuthContext(testUser);
				await createTestFunders(db, testUserAuthContext, {
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
				const db = getDatabase();
				const testUser = await loadTestUser(db);
				const testUserAuthContext = getAuthContext(testUser);
				const systemUser = await loadSystemUser(db, null);
				const systemUserAuthContext = getAuthContext(systemUser);
				await createTestFunders(db, testUserAuthContext, {
					theFundFund: true,
					theFoundationFoundation: false,
					theFundersWhoFund: false,
					theFundingFathers: false,
					theFunnyFunders: false,
					theFungibleFund: false,
				});
				await createPermissionGrant(db, systemUserAuthContext, {
					granteeType: PermissionGrantGranteeType.USER,
					granteeUserKeycloakUserId: testUser.keycloakUserId,
					contextEntityType: PermissionGrantEntityType.FUNDER,
					funderShortCode: 'theFundFund',
					scope: [PermissionGrantEntityType.FUNDER],
					verbs: [PermissionGrantVerb.MANAGE],
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
				const db = getDatabase();
				const testUser = await loadTestUser(db);
				const testUserAuthContext = getAuthContext(testUser);
				const systemUser = await loadSystemUser(db, null);
				const systemUserAuthContext = getAuthContext(systemUser);
				await createTestFunders(db, testUserAuthContext, {
					theFundFund: true,
					theFoundationFoundation: false,
					theFundersWhoFund: false,
					theFundingFathers: false,
					theFunnyFunders: false,
					theFungibleFund: false,
				});
				await createPermissionGrant(db, systemUserAuthContext, {
					granteeType: PermissionGrantGranteeType.USER,
					granteeUserKeycloakUserId: testUser.keycloakUserId,
					contextEntityType: PermissionGrantEntityType.FUNDER,
					funderShortCode: 'theFundFund',
					scope: [PermissionGrantEntityType.FUNDER],
					verbs: [PermissionGrantVerb.MANAGE],
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
				const db = getDatabase();
				const adminUser = await loadTestUser(db);
				const testUser = await loadTestUser(db);
				const testUserAuthContext = getAuthContext(testUser);
				await createTestFunders(db, testUserAuthContext, {
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
				const db = getDatabase();
				const testUser = await loadTestUser(db);
				const testUserAuthContext = getAuthContext(testUser);
				await createTestFunders(db, testUserAuthContext, {
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
				const db = getDatabase();
				const adminUser = await loadTestUser(db);
				const adminUserAuthContext = getAuthContext(adminUser);
				const testUser = await loadTestUser(db);
				const testUserAuthContext = getAuthContext(testUser);
				await createTestFunders(db, testUserAuthContext, {
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
	describe('POST /:shortCode/invitations/sent/:invitedFunderShortCode', () => {
		it('requires authentication', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunders(db, testUserAuthContext, {
				theFundFund: true,
				theFoundationFoundation: false,
				theFundersWhoFund: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});
			await agent
				.post('/funders/theFundFund/invitations/sent/theFoundationFoundation')
				.expect(401);
		});

		it('throws a 400 error if the funder collaborative short code is invalid', async () => {
			await agent
				.post('/funders/!!!!!!!/invitations/sent/theFoundationFoundation')
				.set(adminUserAuthHeader)
				.expect(400);
		});
		it('throws a 400 error if the invited funder short code is invalid', async () => {
			await agent
				.post('/funders/theFundFund/invitations/sent/!!!!!!!')
				.set(adminUserAuthHeader)
				.expect(400);
		});

		it('requires MANAGE permission on the funder', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				isCollaborative: true,
			});
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
			});

			const result = await agent
				.post('/funders/theFundFund/invitations/sent/theFoundationFoundation')
				.type('application/json')
				.send({})
				.set(authHeader)
				.expect(401);

			expect(result.body).toMatchObject({
				message:
					'Authenticated user does not have permission to perform this action.',
				details: expectArray(),
			});
		});

		it('creates an invitation to a non-collaborative funder from a collaborative funder, and returns it', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			await createTestFunders(db, testUserAuthContext, {
				theFundFund: false,
				theFoundationFoundation: true,
				theFundersWhoFund: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: 'theFoundationFoundation',
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.MANAGE],
			});

			const result = await agent
				.post('/funders/theFoundationFoundation/invitations/sent/theFundFund')
				.type('application/json')
				.send({})
				.set(authHeader)
				.expect(201);
			expect(result.body).toMatchObject({
				funderCollaborativeShortCode: 'theFoundationFoundation',
				invitedFunderShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
				createdAt: expectTimestamp(),
			});
		});
		it('returns a 400 error when the source funder is not collaborative', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunders(db, testUserAuthContext, {
				theFundFund: false,
				theFoundationFoundation: false,
				theFundersWhoFund: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});
			const result = await agent
				.post('/funders/theFundFund/invitations/sent/theFoundationFoundation')
				.type('application/json')
				.send({})
				.set(adminUserAuthHeader)
				.expect(400);

			expect(result.body).toMatchObject({
				message: 'A constraint was violated.',
				details: expectArray(),
			});
		});
		it('returns a 400 bad request error when the invited funder is collaborative', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunders(db, testUserAuthContext, {
				theFundFund: true,
				theFoundationFoundation: true,
				theFundersWhoFund: false,
				theFundingFathers: true,
				theFunnyFunders: false,
				theFungibleFund: false,
			});
			const result = await agent
				.post('/funders/theFundFund/invitations/sent/theFoundationFoundation')
				.type('application/json')
				.send({})
				.set(adminUserAuthHeader)
				.expect(400);

			expect(result.body).toMatchObject({
				message: 'A constraint was violated.',
				details: expectArray(),
			});
		});
	});

	describe('GET /:shortCode/invitations/sent', () => {
		it('requires authentication', async () => {
			await agent.get('/funders/foo/invitations/sent').expect(401);
		});

		it('throws a 400 error if the funder short code is invalid', async () => {
			await agent
				.get('/funders/!!!!!!!/invitations/sent')
				.set(adminUserAuthHeader)
				.expect(400);
		});

		it('requires MANAGE permission on the funder', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				isCollaborative: true,
			});

			const result = await agent
				.get('/funders/theFundFund/invitations/sent')
				.type('application/json')
				.set(authHeader)
				.expect(401);

			expect(result.body).toMatchObject({
				message:
					'Authenticated user does not have permission to perform this action.',
				details: expectArray(),
			});
		});

		it('returns all (and only) invitations sent by the funder when the user has MANAGE permission on the funder', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunders(db, testUserAuthContext, {
				theFundFund: true,
				theFoundationFoundation: true,
				theFundersWhoFund: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: 'theFundFund',
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.MANAGE],
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFundFund',
				invitedFunderShortCode: 'theFundingFathers',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});
			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				invitedFunderShortCode: 'theFunnyFunders',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});
			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFundFund',
				invitedFunderShortCode: 'theFunnyFunders',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			const result = await agent
				.get('/funders/theFundFund/invitations/sent')
				.type('application/json')
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				entries: [
					{
						funderCollaborativeShortCode: 'theFundFund',
						invitedFunderShortCode: 'theFunnyFunders',
						invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
						createdAt: expectTimestamp(),
					},
					{
						funderCollaborativeShortCode: 'theFundFund',
						invitedFunderShortCode: 'theFundingFathers',
						invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
						createdAt: expectTimestamp(),
					},
				],
				total: 2,
			});
		});
	});

	describe('GET /:shortCode/invitations/received', () => {
		it('requires authentication', async () => {
			await agent.get('/funders/foo/invitations/received').expect(401);
		});

		it('throws a 400 error if the funder short code is invalid', async () => {
			await agent
				.get('/funders/!!!!!!!/invitations/received')
				.set(adminUserAuthHeader)
				.expect(400);
		});

		it('requires MANAGE permission on the funder', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				isCollaborative: true,
			});

			const result = await agent
				.get('/funders/theFundFund/invitations/received')
				.type('application/json')
				.set(authHeader)
				.expect(401);

			expect(result.body).toMatchObject({
				message:
					'Authenticated user does not have permission to perform this action.',
				details: expectArray(),
			});
		});

		it('returns all (and only) invitations received by the funder when the user has MANAGE permission on the funder', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			await createTestFunders(db, testUserAuthContext, {
				theFundFund: false,
				theFoundationFoundation: true,
				theFundersWhoFund: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: true,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: 'theFundFund',
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.MANAGE],
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				invitedFunderShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				invitedFunderShortCode: 'theFunnyFunders',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFungibleFund',
				invitedFunderShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			const result = await agent
				.get('/funders/theFundFund/invitations/received')
				.type('application/json')
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				entries: [
					{
						funderCollaborativeShortCode: 'theFungibleFund',
						invitedFunderShortCode: 'theFundFund',
						invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
						createdAt: expectTimestamp(),
					},
					{
						funderCollaborativeShortCode: 'theFoundationFoundation',
						invitedFunderShortCode: 'theFundFund',
						invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
						createdAt: expectTimestamp(),
					},
				],
				total: 2,
			});
		});
	});
	describe('PATCH /:shortCode/invitations/received/:invitationShortCode', () => {
		it('requires authentication', async () => {
			await agent.patch('/funders/foo/invitations/received/bar').expect(401);
		});

		it('throws a 400 error if the funder short code is invalid', async () => {
			await agent
				.patch('/funders/!!!!!!!/invitations/received/theFoundationFoundation')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.ACCEPTED,
				})
				.expect(400);
		});

		it('throws a 400 error if the invited funder short code is invalid', async () => {
			await agent
				.patch('/funders/theFundFund/invitations/received/!!!!!!!')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.ACCEPTED,
				})
				.expect(400);
		});

		it('requires MANAGE permission on the invited funder', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			await createTestFunder(db, testUserAuthContext, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				isCollaborative: true,
			});

			await agent
				.patch('/funders/theFundFund/invitations/received/bar')
				.type('application/json')
				.set(authHeader)
				.expect(401);
		});

		it('successfully updates the invitation status to accepted, and creates a funder collaborative member', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			await createTestFunders(db, testUserAuthContext, {
				theFundFund: false,
				theFoundationFoundation: true,
				theFundersWhoFund: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: 'theFundFund',
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.MANAGE],
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				invitedFunderShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			const result = await agent
				.patch(
					'/funders/theFundFund/invitations/received/theFoundationFoundation',
				)
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.ACCEPTED,
				})
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				funderCollaborativeShortCode: 'theFoundationFoundation',
				invitedFunderShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.ACCEPTED,
				createdAt: expectTimestamp(),
			});

			const generatedFunderCollaborativeMember =
				await loadFunderCollaborativeMember(
					db,
					null,
					'theFoundationFoundation',
					'theFundFund',
				);

			expect(generatedFunderCollaborativeMember).toMatchObject({
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberFunderShortCode: 'theFundFund',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
		});
		it('successfully updates the invitation status to rejected, and does not create a funder collaborative member', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			await createTestFunders(db, testUserAuthContext, {
				theFundFund: false,
				theFoundationFoundation: true,
				theFundersWhoFund: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: true,
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: 'theFundFund',
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.MANAGE],
			});

			await createOrUpdateFunderCollaborativeMember(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberFunderShortCode: 'theFundingFathers',
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				invitedFunderShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			const result = await agent
				.patch(
					'/funders/theFundFund/invitations/received/theFoundationFoundation',
				)
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.REJECTED,
				})
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				funderCollaborativeShortCode: 'theFoundationFoundation',
				invitedFunderShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.REJECTED,
				createdAt: expectTimestamp(),
			});

			const tableMetrics = await loadTableMetrics(
				db,
				'funder_collaborative_invitations',
			);
			expect(tableMetrics.count).toEqual(1);
		});
	});
	it('throws a 400 error if the invitation status is updated after it has been accepted', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);

		await createTestFunders(db, testUserAuthContext, {
			theFundFund: false,
			theFoundationFoundation: true,
			theFundersWhoFund: false,
			theFundingFathers: false,
			theFunnyFunders: false,
			theFungibleFund: true,
		});

		await createPermissionGrant(db, systemUserAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: 'theFundFund',
			scope: [PermissionGrantEntityType.FUNDER],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await createOrUpdateFunderCollaborativeMember(db, systemUserAuthContext, {
			funderCollaborativeShortCode: 'theFoundationFoundation',
			memberFunderShortCode: 'theFundingFathers',
		});

		await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
			funderCollaborativeShortCode: 'theFoundationFoundation',
			invitedFunderShortCode: 'theFundFund',
			invitationStatus: FunderCollaborativeInvitationStatus.ACCEPTED,
		});

		const result = await agent
			.patch(
				'/funders/theFundFund/invitations/received/theFoundationFoundation',
			)
			.type('application/json')
			.send({
				invitationStatus: FunderCollaborativeInvitationStatus.REJECTED,
			})
			.set(authHeader)
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'DatabaseError',
			details: expectArray(),
		});
	});
	it('throws a 400 error if the invitation status is updated after it has rejected', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);

		await createTestFunders(db, testUserAuthContext, {
			theFundFund: false,
			theFoundationFoundation: true,
			theFundersWhoFund: false,
			theFundingFathers: false,
			theFunnyFunders: false,
			theFungibleFund: true,
		});

		await createPermissionGrant(db, systemUserAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: 'theFundFund',
			scope: [PermissionGrantEntityType.FUNDER],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await createOrUpdateFunderCollaborativeMember(db, systemUserAuthContext, {
			funderCollaborativeShortCode: 'theFoundationFoundation',
			memberFunderShortCode: 'theFundingFathers',
		});

		await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
			funderCollaborativeShortCode: 'theFoundationFoundation',
			invitedFunderShortCode: 'theFundFund',
			invitationStatus: FunderCollaborativeInvitationStatus.REJECTED,
		});

		const result = await agent
			.patch(
				'/funders/theFundFund/invitations/received/theFoundationFoundation',
			)
			.type('application/json')
			.send({
				invitationStatus: FunderCollaborativeInvitationStatus.ACCEPTED,
			})
			.set(authHeader)
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'DatabaseError',
			details: expectArray(),
		});
	});
	it('throws a 400 error if the invitation status is updated to an invalid value', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);

		await createTestFunders(db, testUserAuthContext, {
			theFundFund: false,
			theFoundationFoundation: true,
			theFundersWhoFund: false,
			theFundingFathers: false,
			theFunnyFunders: false,
			theFungibleFund: true,
		});

		await createPermissionGrant(db, systemUserAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: 'theFundFund',
			scope: [PermissionGrantEntityType.FUNDER],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await createOrUpdateFunderCollaborativeMember(db, systemUserAuthContext, {
			funderCollaborativeShortCode: 'theFoundationFoundation',
			memberFunderShortCode: 'theFundingFathers',
		});

		await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
			funderCollaborativeShortCode: 'theFoundationFoundation',
			invitedFunderShortCode: 'theFundFund',
			invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
		});

		const result = await agent
			.patch(
				'/funders/theFundFund/invitations/received/theFoundationFoundation',
			)
			.type('application/json')
			.send({
				invitationStatus: 'invalid status',
			})
			.set(authHeader)
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
			details: expectArray(),
		});
	});

	it('throws a 400 error if the invitation status is set to null', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const systemUser = await loadSystemUser(db, null);
		const systemUserAuthContext = getAuthContext(systemUser);

		await createTestFunders(db, testUserAuthContext, {
			theFundFund: false,
			theFoundationFoundation: true,
			theFundersWhoFund: false,
			theFundingFathers: false,
			theFunnyFunders: false,
			theFungibleFund: true,
		});

		await createPermissionGrant(db, systemUserAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: 'theFundFund',
			scope: [PermissionGrantEntityType.FUNDER],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
			funderCollaborativeShortCode: 'theFoundationFoundation',
			invitedFunderShortCode: 'theFundFund',
			invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
		});

		const result = await agent
			.patch(
				'/funders/theFundFund/invitations/received/theFoundationFoundation',
			)
			.type('application/json')
			.send({
				invitationStatus: null,
			})
			.set(authHeader)
			.expect(400);

		expect(result.body).toMatchObject({
			name: 'InputValidationError',
			details: expectArray(),
		});
	});
});
