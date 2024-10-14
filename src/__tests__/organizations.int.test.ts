import request from 'supertest';
import { app } from '../app';
import {
	createApplicationForm,
	createApplicationFormField,
	createBaseField,
	createOpportunity,
	createOrganization,
	createOrganizationProposal,
	createOrUpdateFunder,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	createSource,
	loadSystemSource,
	loadSystemUser,
	loadTableMetrics,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import { mockJwt as authHeader } from '../test/mockJwt';
import { BaseFieldDataType, BaseFieldScope, PostgresErrorCode } from '../types';

const insertTestOrganizations = async () => {
	await createOrganization({
		taxId: '11-1111111',
		name: 'Example Inc.',
	});
	await createOrganization({
		taxId: '22-2222222',
		name: 'Another Inc.',
	});
};

describe('/organizations', () => {
	describe('GET /', () => {
		it('does not require authentication', async () => {
			await request(app).get('/organizations').expect(200);
		});

		it('returns an empty Bundle when no data is present', async () => {
			await request(app).get('/organizations').set(authHeader).expect(200, {
				total: 0,
				entries: [],
			});
		});

		it('returns organizations present in the database', async () => {
			await insertTestOrganizations();
			await request(app)
				.get('/organizations')
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								taxId: '22-2222222',
								name: 'Another Inc.',
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 1,
								taxId: '11-1111111',
								name: 'Example Inc.',
								createdAt: expectTimestamp,
								fields: [],
							},
						],
					}),
				);
		});

		it('returns according to pagination parameters', async () => {
			await Array.from(Array(20)).reduce(async (p, _, i) => {
				await p;
				await createOrganization({
					taxId: '11-1111111',
					name: `Organization ${i + 1}`,
				});
			}, Promise.resolve());
			await request(app)
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
								taxId: '11-1111111',
								name: 'Organization 15',
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 14,
								taxId: '11-1111111',
								name: 'Organization 14',
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 13,
								taxId: '11-1111111',
								name: 'Organization 13',
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 12,
								taxId: '11-1111111',
								name: 'Organization 12',
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 11,
								taxId: '11-1111111',
								name: 'Organization 11',
								createdAt: expectTimestamp,
								fields: [],
							},
						],
					}),
				);
		});

		it('returns a subset of organizations present in the database when a proposal filter is provided', async () => {
			await createOpportunity({
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createOrganization({
				taxId: '123-123-123',
				name: 'Canadian Company',
			});
			await createOrganization({
				taxId: '123-123-123',
				name: 'Another Canadian Company',
			});
			await createOrganizationProposal({
				organizationId: 1,
				proposalId: 1,
			});
			const response = await request(app)
				.get(`/organizations?proposal=1`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						taxId: '123-123-123',
						name: 'Canadian Company',
						createdAt: expectTimestamp,
						fields: [],
					},
				],
			});
		});

		it('does not return duplicate organizations when an organization has multiple proposals', async () => {
			await createOpportunity({
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await createProposal({
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposal({
				externalId: 'proposal-2',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createOrganization({
				taxId: '123-123-123',
				name: 'Canadian Company',
			});
			await createOrganizationProposal({
				organizationId: 1,
				proposalId: 1,
			});
			await createOrganizationProposal({
				organizationId: 1,
				proposalId: 2,
			});
			const response = await request(app)
				.get(`/organizations`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						id: 1,
						taxId: '123-123-123',
						name: 'Canadian Company',
						createdAt: expectTimestamp,
						fields: [],
					},
				],
			});
		});

		it('returns a 400 error if an invalid organization filter is provided', async () => {
			const response = await request(app)
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
		it('does not require authentication', async () => {
			await insertTestOrganizations();
			await request(app).get('/organizations/1').expect(200);
		});

		it('returns 404 when given id is not present', async () => {
			await request(app).get('/organizations/9001').set(authHeader).expect(404);
		});

		it('returns the specified organization', async () => {
			await insertTestOrganizations();
			await request(app)
				.get('/organizations/2')
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						id: 2,
						taxId: '22-2222222',
						name: 'Another Inc.',
						createdAt: expectTimestamp,
						fields: [],
					}),
				);
		});

		it('returns a 400 bad request when a non-integer ID is sent', async () => {
			await request(app).get('/organizations/foo').set(authHeader).expect(400);
		});

		it('returns the latest valid value for a base field when auth id is sent', async () => {
			const systemSource = await loadSystemSource();
			const systemUser = await loadSystemUser();

			// Make a base field associated with one opportunity/org, and we'll make three responses.
			const baseFieldId = (
				await createBaseField({
					label: 'Fifty one fifty three',
					shortCode: 'fifty_one_fifty_three',
					description: 'Five thousand one hundred fifty three.',
					dataType: BaseFieldDataType.EMAIL,
					scope: BaseFieldScope.ORGANIZATION,
				})
			).id;
			// To advance test organization IDs beyond 1-2.
			await insertTestOrganizations();
			// This should be ID 3, although unfortunately implicitly, and only when tests run in serial.
			const organizationId = (
				await createOrganization({
					name: 'Five thousand one hundred forty seven reasons',
					taxId: '05119',
				})
			).id;
			const opportunityId = (
				await createOpportunity({
					title: 'Fifty one thirteen',
				})
			).id;
			const proposalId = (
				await createProposal({
					opportunityId,
					externalId: 'Proposal',
					createdBy: systemUser.keycloakUserId,
				})
			).id;
			await createOrganizationProposal({
				organizationId,
				proposalId,
			});
			// I need 3 application form fields here. May as well make them use distinct forms too.
			const applicationFormIdEarliest = (
				await createApplicationForm({
					opportunityId,
				})
			).id;
			// Older field that is valid
			await createProposalFieldValue({
				proposalVersionId: (
					await createProposalVersion({
						proposalId,
						applicationFormId: applicationFormIdEarliest,
						sourceId: systemSource.id,
						createdBy: systemUser.keycloakUserId,
					})
				).id,
				applicationFormFieldId: (
					await createApplicationFormField({
						label: 'Org email',
						applicationFormId: applicationFormIdEarliest,
						baseFieldId,
						position: 5279,
					})
				).id,
				position: 5297,
				value: 'validbutold@emailaddress.com',
				isValid: true,
			});
			const applicationFormIdLatestValid = (
				await createApplicationForm({
					opportunityId,
				})
			).id;
			const latestValidValue = await createProposalFieldValue({
				proposalVersionId: (
					await createProposalVersion({
						proposalId,
						applicationFormId: applicationFormIdLatestValid,
						sourceId: systemSource.id,
						createdBy: systemUser.keycloakUserId,
					})
				).id,
				applicationFormFieldId: (
					await createApplicationFormField({
						label: 'Email contact',
						applicationFormId: applicationFormIdLatestValid,
						baseFieldId,
						position: 5347,
					})
				).id,
				position: 5381,
				value: 'valid@emailaddress.com',
				isValid: true,
			});
			const applicationFormIdLatest = (
				await createApplicationForm({
					opportunityId,
				})
			).id;
			// Latest value but invalid
			await createProposalFieldValue({
				proposalVersionId: (
					await createProposalVersion({
						proposalId,
						applicationFormId: applicationFormIdLatest,
						sourceId: systemSource.id,
						createdBy: systemUser.keycloakUserId,
					})
				).id,
				applicationFormFieldId: (
					await createApplicationFormField({
						label: 'Contact email address',
						applicationFormId: applicationFormIdLatest,
						baseFieldId,
						position: 5209,
					})
				).id,
				position: 5231,
				value: 'invalid-email-address.com',
				isValid: false,
			});
			await request(app)
				.get(`/organizations/${organizationId}`)
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						id: organizationId,
						name: 'Five thousand one hundred forty seven reasons',
						taxId: '05119',
						createdAt: expectTimestamp,
						fields: [latestValidValue],
					}),
				);
		});

		it('returns older changemaker data when newer funder data is present', async () => {
			// Set up changemaker and funder sources.
			const changemaker = await createOrganization({
				taxId: '5387',
				name: 'Changemaker 5387',
			});
			const changemakerSourceId = (
				await createSource({
					organizationId: changemaker.id,
					label: `${changemaker.name} source`,
				})
			).id;
			const funder = await createOrUpdateFunder({
				shortCode: 'funder_5393',
				name: 'Funder 5393',
			});
			const funderSourceId = (
				await createSource({
					funderShortCode: funder.shortCode,
					label: `${funder.name} source`,
				})
			).id;
			// Set up a base field associated with one opportunity, one changemaker, and two responses.
			const baseFieldId = (
				await createBaseField({
					label: 'Fifty three ninety nine',
					shortCode: 'fifty_three_ninety_nine',
					description: 'Five thousand three hundred ninety nine.',
					dataType: BaseFieldDataType.PHONE_NUMBER,
					scope: BaseFieldScope.ORGANIZATION,
				})
			).id;
			const systemUser = await loadSystemUser();
			const opportunity = await createOpportunity({
				title: `${funder.name} opportunity`,
			});
			const proposalId = (
				await createProposal({
					opportunityId: opportunity.id,
					externalId: `Proposal to ${opportunity.title}`,
					createdBy: systemUser.keycloakUserId,
				})
			).id;
			await createOrganizationProposal({
				organizationId: changemaker.id,
				proposalId,
			});
			const applicationFormIdChangemakerEarliest = (
				await createApplicationForm({
					opportunityId: opportunity.id,
				})
			).id;
			// Set up older field value that is from the changemaker. We'll expect this to be returned.
			const changemakerEarliestValue = await createProposalFieldValue({
				proposalVersionId: (
					await createProposalVersion({
						proposalId,
						applicationFormId: applicationFormIdChangemakerEarliest,
						sourceId: changemakerSourceId,
						createdBy: systemUser.keycloakUserId,
					})
				).id,
				applicationFormFieldId: (
					await createApplicationFormField({
						label: 'Org phone',
						applicationFormId: applicationFormIdChangemakerEarliest,
						baseFieldId,
						position: 5407,
					})
				).id,
				position: 5413,
				value: '+15555555555',
				isValid: true,
			});
			const applicationFormIdFunderLatest = (
				await createApplicationForm({
					opportunityId: opportunity.id,
				})
			).id;
			// Set up newer field value that is from the funder.
			await createProposalFieldValue({
				proposalVersionId: (
					await createProposalVersion({
						proposalId,
						applicationFormId: applicationFormIdFunderLatest,
						sourceId: funderSourceId,
						createdBy: systemUser.keycloakUserId,
					})
				).id,
				applicationFormFieldId: (
					await createApplicationFormField({
						label: 'Phone contact',
						applicationFormId: applicationFormIdFunderLatest,
						baseFieldId,
						position: 5417,
					})
				).id,
				position: 5419,
				value: '+16666666666',
				isValid: true,
			});
			await request(app)
				.get(`/organizations/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						...changemaker,
						createdAt: expectTimestamp,
						fields: [changemakerEarliestValue],
					}),
				);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/organizations').expect(401);
		});

		it('creates exactly one organization', async () => {
			const before = await loadTableMetrics('organizations');
			const result = await request(app)
				.post('/organizations')
				.type('application/json')
				.set(authHeader)
				.send({
					taxId: '11-1111111',
					name: 'Example Inc.',
				})
				.expect(201);
			const after = await loadTableMetrics('organizations');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				taxId: '11-1111111',
				name: 'Example Inc.',
				createdAt: expectTimestamp,
				fields: [],
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no taxId is sent', async () => {
			const result = await request(app)
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
			const result = await request(app)
				.post('/organizations')
				.type('application/json')
				.set(authHeader)
				.send({
					taxId: '11-1111111',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 409 conflict when an existing EIN + name combination is submitted', async () => {
			await createOrganization({
				taxId: '11-1111111',
				name: 'Example Inc.',
			});
			const result = await request(app)
				.post('/organizations')
				.type('application/json')
				.set(authHeader)
				.send({
					taxId: '11-1111111',
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
