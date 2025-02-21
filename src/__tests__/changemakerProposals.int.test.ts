import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOpportunity,
	createChangemaker,
	createChangemakerProposal,
	createProposal,
	loadTableMetrics,
	loadSystemFunder,
	loadSystemUser,
	createOrUpdateUserFunderPermission,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import { Permission } from '../types';

const insertTestChangemakers = async () => {
	await createChangemaker(db, null, {
		taxId: '11-1111111',
		name: 'Example Inc.',
		keycloakOrganizationId: null,
	});
	await createChangemaker(db, null, {
		taxId: '22-2222222',
		name: 'Another Inc.',
		keycloakOrganizationId: '402b1208-be48-11ef-8af9-b767e5e8e4ee',
	});
};

describe('/changemakerProposals', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/changemakerProposals').expect(401);
		});

		it('returns the ChangemakerProposals for the specified changemaker', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const testUser = await loadTestUser();
			await insertTestChangemakers();
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '2',
				createdBy: testUser.keycloakUserId,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 1,
				proposalId: 1,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 1,
				proposalId: 2,
			});
			const result = await request(app)
				.get(`/changemakerProposals?changemaker=1`)
				.set(authHeader)
				.expect(200);
			expect(result.body).toEqual({
				entries: [
					{
						id: 2,
						changemakerId: 1,
						changemaker: {
							id: 1,
							name: 'Example Inc.',
							taxId: '11-1111111',
							keycloakOrganizationId: null,
							createdAt: expectTimestamp,
							fiscalSponsors: [],
							fields: [],
						},
						proposalId: 2,
						proposal: {
							id: 2,
							opportunityId: 1,
							externalId: '2',
							versions: [],
							createdAt: expectTimestamp,
							createdBy: testUser.keycloakUserId,
						},
						createdAt: expectTimestamp,
					},
					{
						id: 1,
						changemakerId: 1,
						changemaker: {
							id: 1,
							name: 'Example Inc.',
							taxId: '11-1111111',
							keycloakOrganizationId: null,
							createdAt: expectTimestamp,
							fiscalSponsors: [],
							fields: [],
						},
						proposalId: 1,
						proposal: {
							id: 1,
							opportunityId: 1,
							externalId: '1',
							versions: [],
							createdAt: expectTimestamp,
							createdBy: testUser.keycloakUserId,
						},
						createdAt: expectTimestamp,
					},
				],
				total: 2,
			});
		});

		it('returns the ProposalChangemakers for the specified proposal', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const testUser = await loadTestUser();
			await insertTestChangemakers();
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '2',
				createdBy: testUser.keycloakUserId,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 1,
				proposalId: 1,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 2,
				proposalId: 2,
			});
			const result = await request(app)
				.get(`/changemakerProposals?proposal=1`)
				.set(authHeader)
				.expect(200);
			expect(result.body).toEqual({
				entries: [
					{
						id: 1,
						changemakerId: 1,
						changemaker: {
							id: 1,
							name: 'Example Inc.',
							taxId: '11-1111111',
							keycloakOrganizationId: null,
							createdAt: expectTimestamp,
							fiscalSponsors: [],
							fields: [],
						},
						proposalId: 1,
						proposal: {
							id: 1,
							opportunityId: 1,
							externalId: '1',
							versions: [],
							createdAt: expectTimestamp,
							createdBy: testUser.keycloakUserId,
						},
						createdAt: expectTimestamp,
					},
				],
				total: 2,
			});
		});

		it('returns a 400 bad request when a non-integer ID is sent', async () => {
			await insertTestChangemakers();
			await request(app)
				.get('/changemakerProposals?changemaker=foo')
				.set(authHeader)
				.expect(400);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/changemakerProposals').expect(401);
		});

		it('creates exactly one ChangemakerProposal when the user is an administrator', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			const testUser = await loadTestUser();
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			const before = await loadTableMetrics('changemakers_proposals');
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					changemakerId: 1,
					proposalId: 1,
				})
				.expect(201);
			const after = await loadTableMetrics('changemakers_proposals');
			expect(before.count).toEqual(0);
			expect(result.body).toStrictEqual({
				id: 1,
				changemakerId: 1,
				changemaker: {
					id: 1,
					name: 'Example Inc.',
					taxId: '11-1111111',
					keycloakOrganizationId: null,
					createdAt: expectTimestamp,
					fiscalSponsors: [],
					fields: [],
				},
				proposalId: 1,
				proposal: {
					id: 1,
					opportunityId: 1,
					externalId: '1',
					versions: [],
					createdAt: expectTimestamp,
					createdBy: testUser.keycloakUserId,
				},
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('creates exactly one ChangemakerProposal when the user has write permission on the funder associated with the proposal opportunity', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
				createdBy: systemUser.keycloakUserId,
			});
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			const before = await loadTableMetrics('changemakers_proposals');
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					changemakerId: 1,
					proposalId: 1,
				})
				.expect(201);
			const after = await loadTableMetrics('changemakers_proposals');
			expect(result.body).toStrictEqual({
				id: 1,
				changemakerId: 1,
				changemaker: {
					id: 1,
					name: 'Example Inc.',
					taxId: '11-1111111',
					keycloakOrganizationId: null,
					createdAt: expectTimestamp,
					fiscalSponsors: [],
					fields: [],
				},
				proposalId: 1,
				proposal: {
					id: 1,
					opportunityId: 1,
					externalId: '1',
					versions: [],
					createdAt: expectTimestamp,
					createdBy: testUser.keycloakUserId,
				},
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 Unprocessable Content if the user does not have edit permission on the funder associated with the proposal opportunity', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser();
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			const before = await loadTableMetrics('changemakers_proposals');
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					changemakerId: 1,
					proposalId: 1,
				})
				.expect(422);
			const after = await loadTableMetrics('changemakers_proposals');
			expect(result.body).toEqual({
				details: [
					{
						name: 'UnprocessableEntityError',
					},
				],
				message:
					'You do not have write permissions on the funder associated with this proposal.',
				name: 'UnprocessableEntityError',
			});
			expect(after.count).toEqual(before.count);
		});

		it('returns 400 bad request when no proposalId is sent', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const testUser = await loadTestUser();
			await insertTestChangemakers();
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					changemakerId: 1,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no changemakerId is sent', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const testUser = await loadTestUser();
			await insertTestChangemakers();
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					proposalId: 1,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 422 Unprocessable Content when a non-existent proposal is sent', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					changemakerId: 1,
					proposalId: 42,
				})
				.expect(422);
			expect(result.body).toEqual({
				details: [
					{
						name: 'UnprocessableEntityError',
					},
				],
				message: 'related Proposal not found.',
				name: 'UnprocessableEntityError',
			});
		});

		it('returns 422 Unprocessable Content when a non-existent changemaker is sent', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
				createdBy: systemUser.keycloakUserId,
			});
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					changemakerId: 42,
					proposalId: 1,
				})
				.expect(422);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
			});
		});

		it('returns 409 Conflict when attempting to create a duplicate ChangemakerProposal', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: systemFunder.shortCode,
				permission: Permission.EDIT,
				createdBy: systemUser.keycloakUserId,
			});
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, null, {
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.keycloakUserId,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 1,
				proposalId: 1,
			});
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					changemakerId: 1,
					proposalId: 1,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
			});
		});
	});
});
