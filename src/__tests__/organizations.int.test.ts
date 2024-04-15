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
import { PostgresErrorCode } from '../types';

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

describe('/organizations', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await agent.get('/organizations').expect(401);
		});

		it('returns an empty Bundle when no data is present', async () => {
			await agent.get('/organizations').set(authHeader).expect(200, {
				total: 0,
				entries: [],
			});
		});

		it('returns organizations present in the database', async () => {
			await insertTestOrganizations();
			await agent
				.get('/organizations')
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								employerIdentificationNumber: '22-2222222',
								name: 'Another Inc.',
								createdAt: expectTimestamp,
							},
							{
								id: 1,
								employerIdentificationNumber: '11-1111111',
								name: 'Example Inc.',
								createdAt: expectTimestamp,
							},
						],
					}),
				);
		});

		it('returns according to pagination parameters', async () => {
			await Array.from(Array(20)).reduce(async (p, _, i) => {
				await p;
				await db.sql('organizations.insertOne', {
					employerIdentificationNumber: '11-1111111',
					name: `Organization ${i + 1}`,
				});
			}, Promise.resolve());
			await agent
				.get('/organizations')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 20,
						entries: [
							{
								id: 15,
								employerIdentificationNumber: '11-1111111',
								name: 'Organization 15',
								createdAt: expectTimestamp,
							},
							{
								id: 14,
								employerIdentificationNumber: '11-1111111',
								name: 'Organization 14',
								createdAt: expectTimestamp,
							},
							{
								id: 13,
								employerIdentificationNumber: '11-1111111',
								name: 'Organization 13',
								createdAt: expectTimestamp,
							},
							{
								id: 12,
								employerIdentificationNumber: '11-1111111',
								name: 'Organization 12',
								createdAt: expectTimestamp,
							},
							{
								id: 11,
								employerIdentificationNumber: '11-1111111',
								name: 'Organization 11',
								createdAt: expectTimestamp,
							},
						],
					}),
				);
		});

		it('returns a subset of organizations present in the database when a proposal filter is provided', async () => {
			await db.sql('opportunities.insertOne', {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.id,
			});
			await createOrganization({
				employerIdentificationNumber: '123-123-123',
				name: 'Canadian Company',
			});
			await createOrganization({
				employerIdentificationNumber: '123-123-123',
				name: 'Another Canadian Company',
			});
			await createOrganizationProposal({
				organizationId: 1,
				proposalId: 1,
			});
			const response = await agent
				.get(`/organizations?proposal=1`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						employerIdentificationNumber: '123-123-123',
						name: 'Canadian Company',
						createdAt: expectTimestamp,
					},
				],
			});
		});

		it('returns a 400 error if an invalid organization filter is provided', async () => {
			const response = await agent
				.get(`/proposals?organization=foo`)
				.set(authHeader)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				message: expect.any(String) as string,
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await agent.get('/organizations/1').expect(401);
		});

		it('returns 404 when given id is not present', async () => {
			await agent.get('/organizations/9001').set(authHeader).expect(404);
		});

		it('returns the specified organization', async () => {
			await insertTestOrganizations();
			await agent
				.get('/organizations/2')
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						id: 2,
						employerIdentificationNumber: '22-2222222',
						name: 'Another Inc.',
						createdAt: expectTimestamp,
					}),
				);
		});

		it('returns a 400 bad request when a non-integer ID is sent', async () => {
			await insertTestOrganizations();
			await agent.get('/organizations/foo').set(authHeader).expect(400);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await agent.post('/organizations').expect(401);
		});

		it('creates exactly one organization', async () => {
			const before = await loadTableMetrics('organizations');
			const result = await agent
				.post('/organizations')
				.type('application/json')
				.set(authHeader)
				.send({
					employerIdentificationNumber: '11-1111111',
					name: 'Example Inc.',
				})
				.expect(201);
			const after = await loadTableMetrics('organizations');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				employerIdentificationNumber: '11-1111111',
				name: 'Example Inc.',
				createdAt: expectTimestamp,
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no employerIdentificationNumber is sent', async () => {
			const result = await agent
				.post('/organizations')
				.type('application/json')
				.set(authHeader)
				.send({
					name: 'Foo Co.',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 400 bad request when no name is sent', async () => {
			const result = await agent
				.post('/organizations')
				.type('application/json')
				.set(authHeader)
				.send({
					employerIdentificationNumber: '11-1111111',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 409 conflict when an existing EIN + name combination is submitted', async () => {
			await createOrganization({
				employerIdentificationNumber: '11-1111111',
				name: 'Example Inc.',
			});
			const result = await agent
				.post('/organizations')
				.type('application/json')
				.set(authHeader)
				.send({
					employerIdentificationNumber: '11-1111111',
					name: 'Example Inc.',
				})
				.expect(409);
			expect(result.body).toMatchObject({
				name: 'DatabaseError',
				details: [
					{
						code: PostgresErrorCode.UNIQUE_VIOLATION,
					},
				],
			});
		});
	});
});
