import request from 'supertest';
import { app } from '../app';
import {
	createOrganization,
	createOrganizationProposal,
	createProposal,
	db,
	loadTableMetrics,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';

const agent = request.agent(app);

const insertTestOrganizations = async () => {
	await createOrganization({
		employerIdentificationNumber: '11-1111111',
		name: 'Example Inc.',
	});
	await createOrganization({
		employerIdentificationNumber: '22-2222222',
		name: 'Another Inc.',
	});
};

describe('/organizationProposals', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/organizationProposals').expect(401);
		});

		it('returns the OrganizationProposals for the specified organization', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await insertTestOrganizations();
			await createProposal({
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.id,
			});
			await createProposal({
				opportunityId: 1,
				externalId: '2',
				createdBy: testUser.id,
			});
			await createOrganizationProposal({
				organizationId: 1,
				proposalId: 1,
			});
			await createOrganizationProposal({
				organizationId: 1,
				proposalId: 2,
			});
			const result = await agent
				.get(`/organizationProposals?organization=1`)
				.set(authHeader)
				.expect(200);
			expect(result.body).toEqual({
				entries: [
					{
						id: 2,
						organizationId: 1,
						organization: {
							id: 1,
							name: 'Example Inc.',
							employerIdentificationNumber: '11-1111111',
							createdAt: expectTimestamp,
						},
						proposalId: 2,
						proposal: {
							id: 2,
							opportunityId: 1,
							externalId: '2',
							versions: [],
							createdAt: expectTimestamp,
							createdBy: testUser.id,
						},
						createdAt: expectTimestamp,
					},
					{
						id: 1,
						organizationId: 1,
						organization: {
							id: 1,
							name: 'Example Inc.',
							employerIdentificationNumber: '11-1111111',
							createdAt: expectTimestamp,
						},
						proposalId: 1,
						proposal: {
							id: 1,
							opportunityId: 1,
							externalId: '1',
							versions: [],
							createdAt: expectTimestamp,
							createdBy: testUser.id,
						},
						createdAt: expectTimestamp,
					},
				],
				total: 2,
			});
		});

		it('returns the ProposalOrganizations for the specified proposal', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await insertTestOrganizations();
			await createProposal({
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.id,
			});
			await createProposal({
				opportunityId: 1,
				externalId: '2',
				createdBy: testUser.id,
			});
			await createOrganizationProposal({
				organizationId: 1,
				proposalId: 1,
			});
			await createOrganizationProposal({
				organizationId: 2,
				proposalId: 2,
			});
			const result = await agent
				.get(`/organizationProposals?proposal=1`)
				.set(authHeader)
				.expect(200);
			expect(result.body).toEqual({
				entries: [
					{
						id: 1,
						organizationId: 1,
						organization: {
							id: 1,
							name: 'Example Inc.',
							employerIdentificationNumber: '11-1111111',
							createdAt: expectTimestamp,
						},
						proposalId: 1,
						proposal: {
							id: 1,
							opportunityId: 1,
							externalId: '1',
							versions: [],
							createdAt: expectTimestamp,
							createdBy: testUser.id,
						},
						createdAt: expectTimestamp,
					},
				],
				total: 2,
			});
		});

		it('returns a 400 bad request when a non-integer ID is sent', async () => {
			await insertTestOrganizations();
			await agent
				.get('/organizationProposals?organization=foo')
				.set(authHeader)
				.expect(400);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/organizationProposals').expect(401);
		});

		it('creates exactly one OrganizationProposal', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			await insertTestOrganizations();
			const testUser = await loadTestUser();
			await createProposal({
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.id,
			});
			const before = await loadTableMetrics('organizations_proposals');
			const result = await agent
				.post('/organizationProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					organizationId: 1,
					proposalId: 1,
				})
				.expect(201);
			const after = await loadTableMetrics('organizations_proposals');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				organizationId: 1,
				organization: {
					id: 1,
					name: 'Example Inc.',
					employerIdentificationNumber: '11-1111111',
					createdAt: expectTimestamp,
				},
				proposalId: 1,
				proposal: {
					id: 1,
					opportunityId: 1,
					externalId: '1',
					versions: [],
					createdAt: expectTimestamp,
					createdBy: testUser.id,
				},
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no proposalId is sent', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await insertTestOrganizations();
			await createProposal({
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.id,
			});
			const result = await agent
				.post('/organizationProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					organizationId: 1,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no organizationId is sent', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await insertTestOrganizations();
			await createProposal({
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.id,
			});
			const result = await agent
				.post('/organizationProposals')
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

		it('returns 409 Conflict when a non-existent proposal is sent', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			await insertTestOrganizations();
			const result = await agent
				.post('/organizationProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					organizationId: 1,
					proposalId: 42,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
			});
		});

		it('returns 409 Conflict when a non-existent organization is sent', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await createProposal({
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.id,
			});
			const result = await agent
				.post('/organizationProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					organizationId: 42,
					proposalId: 1,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
			});
		});

		it('returns 409 Conflict when attempting to create a duplicate OrganizationProposal', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await insertTestOrganizations();
			await createProposal({
				opportunityId: 1,
				externalId: '1',
				createdBy: testUser.id,
			});
			await createOrganizationProposal({
				organizationId: 1,
				proposalId: 1,
			});
			const result = await agent
				.post('/organizationProposals')
				.type('application/json')
				.set(authHeader)
				.send({
					organizationId: 1,
					proposalId: 1,
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
			});
		});
	});
});
