import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOrUpdateFunder,
	loadFunder,
	loadTableMetrics,
	loadSystemFunder,
	createFunderCollaborativeMember,
	loadSystemUser,
	createOrUpdateUserFunderPermission,
	createFunderCollaborativeInvitation,
	loadFunderCollaborativeMember,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { expectArray, expectTimestamp } from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import { FunderCollaborativeInvitationStatus, Permission } from '../types';

const agent = request.agent(app);

const createTestFunders = async ({
	theFundFund,
	theFoundationFoundation,
	theFundingFathers,
	theFunnyFunders,
	theFungibleFund,
}: {
	theFundFund: boolean;
	theFoundationFoundation: boolean;
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

	describe('POST /:shortCode/invitations/sent', () => {
		it('requires authentication', async () => {
			await agent.post('/funders/foo/invitations/sent').expect(401);
		});

		it('requires MANAGE permission on the funder', async () => {
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				keycloakOrganizationId: null,
				isCollaborative: true,
			});
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFoundationFoundation',
				name: 'The Foundation Foundation',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});

			const result = await agent
				.post('/funders/theFundFund/invitations/sent')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
				})
				.set(authHeader)
				.expect(401);

			expect(result.body).toMatchObject({
				message:
					'Authenticated user does not have permission to perform this action.',
				details: expectArray(),
			});
		});

		it('creates an invitation to a non-collaborative funder from a collaborative funder, and returns it', async () => {
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});

			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: 'theFundFund',
				permission: Permission.MANAGE,
			});

			await createFunderCollaborativeMember(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberShortCode: 'theFundFund',
			});

			const result = await agent
				.post('/funders/theFoundationFoundation/invitations/sent')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
					invitationShortCode: 'theFundingFathers',
				})
				.set(authHeader)
				.expect(201);
			expect(result.body).toMatchObject({
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFundingFathers',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
				createdAt: expectTimestamp(),
			});
		});
		it('returns a 400 error when the source funder is not collaborative', async () => {
			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: false,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});
			const result = await agent
				.post('/funders/theFundFund/invitations/sent')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
					invitationShortCode: 'theFoundationFoundation',
				})
				.set(adminUserAuthHeader)
				.expect(400);

			expect(result.body).toMatchObject({
				message: 'A constraint was violated.',
				details: expectArray(),
			});
		});
		it('returns a 400 bad request error when the invited funder is collaborative', async () => {
			await createTestFunders({
				theFundFund: true,
				theFoundationFoundation: true,
				theFundingFathers: true,
				theFunnyFunders: false,
				theFungibleFund: false,
			});
			const result = await agent
				.post('/funders/theFundFund/invitations/sent')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
					invitationShortCode: 'theFoundationFoundation',
				})
				.set(adminUserAuthHeader)
				.expect(400);

			expect(result.body).toMatchObject({
				message: 'A constraint was violated.',
				details: expectArray(),
			});
		});
		it('returns 400 bad request error when the invitation status is not provided', async () => {
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});

			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: 'theFundFund',
				permission: Permission.MANAGE,
			});

			await createFunderCollaborativeMember(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberShortCode: 'theFundFund',
			});

			const result = await agent
				.post('/funders/theFundFund/invitations/sent')
				.type('application/json')
				.send({
					invitationShortCode: 'theFundingFathers',
				})
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				message: 'Invalid request body.',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when the invitation short code is not provided', async () => {
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: false,
			});

			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: 'theFundFund',
				permission: Permission.MANAGE,
			});

			await createFunderCollaborativeMember(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberShortCode: 'theFundFund',
			});
			const result = await agent
				.post('/funders/theFundFund/invitations/sent')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
				})
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				message: 'Invalid request body.',
				details: expectArray(),
			});
		});
		it('returns a 404 not found error when the funder short code is not a valid short code', async () => {
			const result = await agent
				.post('/funders/foo/invitations/sent')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
				})
				.set(adminUserAuthHeader)
				.expect(404);

			expect(result.body).toMatchObject({
				message: 'Entity not found',
				details: expectArray(),
			});
		});

		it('returns a 404 not found error when the invited funder short code is not a valid short code', async () => {
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				keycloakOrganizationId: null,
				isCollaborative: true,
			});

			const result = await agent
				.post('/funders/theFundFund/invitations/sent')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
					invitationShortCode: 'bar',
				})
				.set(adminUserAuthHeader)
				.expect(404);

			expect(result.body).toMatchObject({
				message: 'Entity not found',
				details: expectArray(),
			});
		});
	});
	describe('GET /:shortCode/invitations/sent', () => {
		it('requires authentication', async () => {
			await agent.get('/funders/foo/invitations/sent').expect(401);
		});

		it('requires MANAGE permission on the funder', async () => {
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				keycloakOrganizationId: null,
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: true,
			});

			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: 'theFundFund',
				permission: Permission.MANAGE,
			});

			await createFunderCollaborativeMember(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberShortCode: 'theFundFund',
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFundingFathers',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});
			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFunnyFunders',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});
			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderShortCode: 'theFungibleFund',
				invitationShortCode: 'theFunnyFunders',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			const result = await agent
				.get('/funders/theFoundationFoundation/invitations/sent')
				.type('application/json')
				.set(authHeader)
				.expect(200);

			expect(result.body).toMatchObject({
				entries: [
					{
						funderShortCode: 'theFoundationFoundation',
						invitationShortCode: 'theFunnyFunders',
						invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
						createdAt: expectTimestamp(),
					},
					{
						funderShortCode: 'theFoundationFoundation',
						invitationShortCode: 'theFundingFathers',
						invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
						createdAt: expectTimestamp(),
					},
				],
				total: 3,
			});
		});
		it('returns a 404 not found error when the funder short code is not a valid short code', async () => {
			const result = await agent
				.post('/funders/foo/invitations/sent')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
				})
				.set(adminUserAuthHeader)
				.expect(404);

			expect(result.body).toMatchObject({
				message: 'Entity not found',
				details: expectArray(),
			});
		});
	});

	describe('GET /:shortCode/invitations/received', () => {
		it('requires authentication', async () => {
			await agent.get('/funders/foo/invitations/received').expect(401);
		});

		it('requires MANAGE permission on the funder', async () => {
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				keycloakOrganizationId: null,
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
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: true,
			});

			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: 'theFundFund',
				permission: Permission.MANAGE,
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFunnyFunders',
				invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderShortCode: 'theFungibleFund',
				invitationShortCode: 'theFundFund',
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
						funderShortCode: 'theFungibleFund',
						invitationShortCode: 'theFundFund',
						invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
						createdAt: expectTimestamp(),
					},
					{
						funderShortCode: 'theFoundationFoundation',
						invitationShortCode: 'theFundFund',
						invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
						createdAt: expectTimestamp(),
					},
				],
				total: 3,
			});
		});
		it('returns a 404 not found error when the funder does not exist', async () => {
			const result = await agent
				.get('/funders/foo/invitations/received')
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
				})
				.set(adminUserAuthHeader)
				.expect(404);

			expect(result.body).toMatchObject({
				message: 'Entity not found',
				details: expectArray(),
			});
		});
	});
	describe('PATCH /:shortCode/invitations/received/:invitationShortCode', () => {
		it('requires authentication', async () => {
			await agent.patch('/funders/foo/invitations/received/bar').expect(401);
		});

		it('requires MANAGE permission on the invited funder', async () => {
			await createOrUpdateFunder(db, null, {
				shortCode: 'theFundFund',
				name: 'The Fund Fund',
				keycloakOrganizationId: null,
				isCollaborative: true,
			});

			await agent
				.patch('/funders/theFundFund/invitations/received/bar')
				.type('application/json')
				.set(authHeader)
				.expect(401);
		});

		it('successfully updates the invitation status to accepted, and creates a funder collaborative member', async () => {
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: true,
			});

			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: 'theFundFund',
				permission: Permission.MANAGE,
			});

			await createFunderCollaborativeMember(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberShortCode: 'theFundingFathers',
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFundFund',
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
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFundFund',
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
				memberShortCode: 'theFundFund',
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
		});
		it('successfully updates the invitation status to rejected, and does not create a funder collaborative member', async () => {
			const testUser = await loadTestUser();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: true,
			});

			await createOrUpdateUserFunderPermission(db, systemUserAuthContext, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: 'theFundFund',
				permission: Permission.MANAGE,
			});

			await createFunderCollaborativeMember(db, systemUserAuthContext, {
				funderCollaborativeShortCode: 'theFoundationFoundation',
				memberShortCode: 'theFundingFathers',
			});

			await createFunderCollaborativeInvitation(db, systemUserAuthContext, {
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFundFund',
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
				funderShortCode: 'theFoundationFoundation',
				invitationShortCode: 'theFundFund',
				invitationStatus: FunderCollaborativeInvitationStatus.REJECTED,
				createdAt: expectTimestamp(),
			});

			const tableMetrics = await loadTableMetrics(
				'funder_collaborative_invitations',
			);
			expect(tableMetrics.count).toEqual(1);
		});
		it('returns a 404 not found error when there is no invitation with the given short code', async () => {
			await createTestFunders({
				theFundFund: false,
				theFoundationFoundation: true,
				theFundingFathers: false,
				theFunnyFunders: false,
				theFungibleFund: true,
			});
			const result = await agent
				.patch(
					'/funders/theFundFund/invitations/received/theFoundationFoundation',
				)
				.type('application/json')
				.send({
					invitationStatus: FunderCollaborativeInvitationStatus.PENDING,
				})
				.set(adminUserAuthHeader)
				.expect(404);

			expect(result.body).toMatchObject({
				message: 'Entity not found',
				details: expectArray(),
			});
		});
	});
});
