import request from 'supertest';
import { app } from '../app';
import {
	db,
	createApplicationForm,
	createApplicationFormField,
	createBaseField,
	createOpportunity,
	createChangemaker,
	createChangemakerProposal,
	createOrUpdateFunder,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	createSource,
	loadSystemSource,
	loadSystemUser,
	loadTableMetrics,
	createOrUpdateDataProvider,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	BaseField,
	BaseFieldDataType,
	BaseFieldScope,
	Changemaker,
	DataProvider,
	Funder,
	Id,
	Opportunity,
	PostgresErrorCode,
	Source,
	stringToKeycloakId,
	User,
} from '../types';

const insertTestChangemakers = async () => {
	await createChangemaker(db, null, {
		taxId: '11-1111111',
		name: 'Example Inc.',
		keycloakOrganizationId: null,
	});
	await createChangemaker(db, null, {
		taxId: '22-2222222',
		name: 'Another Inc.',
		keycloakOrganizationId: '57ceaca8-be48-11ef-8c91-5732d98a77e1',
	});
};

describe('/changemakers', () => {
	describe('GET /', () => {
		it('does not require authentication', async () => {
			await request(app).get('/changemakers').expect(200);
		});

		it('returns an empty Bundle when no data is present', async () => {
			await request(app).get('/changemakers').set(authHeader).expect(200, {
				total: 0,
				entries: [],
			});
		});

		it('returns changemakers present in the database', async () => {
			await insertTestChangemakers();
			await request(app)
				.get('/changemakers')
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
								keycloakOrganizationId: '57ceaca8-be48-11ef-8c91-5732d98a77e1',
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 1,
								taxId: '11-1111111',
								name: 'Example Inc.',
								keycloakOrganizationId: null,
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
				await createChangemaker(db, null, {
					taxId: '11-1111111',
					name: `Changemaker ${i + 1}`,
					keycloakOrganizationId: null,
				});
			}, Promise.resolve());
			await request(app)
				.get('/changemakers')
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
								name: 'Changemaker 15',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 14,
								taxId: '11-1111111',
								name: 'Changemaker 14',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 13,
								taxId: '11-1111111',
								name: 'Changemaker 13',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 12,
								taxId: '11-1111111',
								name: 'Changemaker 12',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp,
								fields: [],
							},
							{
								id: 11,
								taxId: '11-1111111',
								name: 'Changemaker 11',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp,
								fields: [],
							},
						],
					}),
				);
		});

		it('returns a subset of changemakers present in the database when a proposal filter is provided', async () => {
			await createOpportunity(db, null, {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await createProposal(db, null, {
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createChangemaker(db, null, {
				taxId: '123-123-123',
				name: 'Canadian Company',
				keycloakOrganizationId: null,
			});
			await createChangemaker(db, null, {
				taxId: '123-123-123',
				name: 'Another Canadian Company',
				keycloakOrganizationId: null,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 1,
				proposalId: 1,
			});
			const response = await request(app)
				.get(`/changemakers?proposal=1`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						taxId: '123-123-123',
						name: 'Canadian Company',
						keycloakOrganizationId: null,
						createdAt: expectTimestamp,
						fields: [],
					},
				],
			});
		});

		it('does not return duplicate changemakers when a changemaker has multiple proposals', async () => {
			await createOpportunity(db, null, {
				title: '🔥',
			});
			const testUser = await loadTestUser();
			await createProposal(db, null, {
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				externalId: 'proposal-2',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createChangemaker(db, null, {
				taxId: '123-123-123',
				name: 'Canadian Company',
				keycloakOrganizationId: null,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 1,
				proposalId: 1,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 1,
				proposalId: 2,
			});
			const response = await request(app)
				.get(`/changemakers`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						id: 1,
						taxId: '123-123-123',
						name: 'Canadian Company',
						keycloakOrganizationId: null,
						createdAt: expectTimestamp,
						fields: [],
					},
				],
			});
		});

		it('returns a 400 error if an invalid changemaker filter is provided', async () => {
			const response = await request(app)
				.get(`/proposals?changemaker=foo`)
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
			await insertTestChangemakers();
			await request(app).get('/changemakers/1').expect(200);
		});

		it('returns 404 when given id is not present', async () => {
			await request(app).get('/changemakers/9001').set(authHeader).expect(404);
		});

		it('returns the specified changemaker', async () => {
			await insertTestChangemakers();
			await request(app)
				.get('/changemakers/2')
				.set(authHeader)
				.expect(200)
				.expect((res) =>
					expect(res.body).toEqual({
						id: 2,
						taxId: '22-2222222',
						name: 'Another Inc.',
						keycloakOrganizationId: '57ceaca8-be48-11ef-8c91-5732d98a77e1',
						createdAt: expectTimestamp,
						fields: [],
					}),
				);
		});

		it('returns a 400 bad request when a non-integer ID is sent', async () => {
			await request(app).get('/changemakers/foo').set(authHeader).expect(400);
		});

		describe('tests that find gold data among proposals and share a common db', () => {
			let systemSource: Source;
			let systemUser: User;
			let baseFieldEmail: BaseField;
			let baseFieldPhone: BaseField;
			let baseFieldWebsite: BaseField;
			let firstChangemaker: Changemaker;
			let secondChangemaker: Changemaker;
			let secondChangemakerSourceId: Id;
			let firstFunder: Funder;
			let firstFunderOpportunity: Opportunity;
			let firstFunderSourceId: Id;
			let firstDataProvider: DataProvider;
			let firstDataProviderSourceId: Id;
			let secondDataProvider: DataProvider;
			let secondDataProviderSourceId: Id;

			beforeEach(async () => {
				systemSource = await loadSystemSource(db, null);
				systemUser = await loadSystemUser(db, null);
				baseFieldEmail = await createBaseField(db, null, {
					label: 'Fifty one fifty three',
					shortCode: 'fifty_one_fifty_three',
					description: 'Five thousand one hundred fifty three.',
					dataType: BaseFieldDataType.EMAIL,
					scope: BaseFieldScope.ORGANIZATION,
				});
				baseFieldPhone = await createBaseField(db, null, {
					label: 'Fifty three ninety nine',
					shortCode: 'fifty_three_ninety_nine',
					description: 'Five thousand three hundred ninety nine.',
					dataType: BaseFieldDataType.PHONE_NUMBER,
					scope: BaseFieldScope.ORGANIZATION,
				});
				baseFieldWebsite = await createBaseField(db, null, {
					label: 'Fifty four seventy one 5471',
					shortCode: 'fifty_four_seventy_one',
					description: 'Five thousand four hundred seventy one.',
					dataType: BaseFieldDataType.URL,
					scope: BaseFieldScope.ORGANIZATION,
				});
				firstChangemaker = await createChangemaker(db, null, {
					name: 'Five thousand one hundred forty seven reasons',
					taxId: '05119',
					keycloakOrganizationId: null,
				});
				secondChangemaker = await createChangemaker(db, null, {
					taxId: '5387',
					name: 'Changemaker 5387',
					keycloakOrganizationId: '8b15d276-be48-11ef-a061-5b4a50e82d50',
				});
				secondChangemakerSourceId = (
					await createSource(db, null, {
						changemakerId: secondChangemaker.id,
						label: `${secondChangemaker.name} source`,
					})
				).id;
				firstFunder = await createOrUpdateFunder(db, null, {
					shortCode: 'funder_5393',
					name: 'Funder 5393',
					keycloakOrganizationId: null,
				});
				firstFunderOpportunity = await createOpportunity(db, null, {
					title: `${firstFunder.name} opportunity`,
				});
				firstFunderSourceId = (
					await createSource(db, null, {
						funderShortCode: firstFunder.shortCode,
						label: `${firstFunder.name} source`,
					})
				).id;
				firstDataProvider = await createOrUpdateDataProvider(db, null, {
					shortCode: 'data_provider_5431',
					name: 'Data Platform Provider 5431',
					keycloakOrganizationId: null,
				});
				secondDataProvider = await createOrUpdateDataProvider(db, null, {
					shortCode: 'data_provider_5477',
					name: 'Data Platform Provider 5477',
					keycloakOrganizationId: null,
				});
				firstDataProviderSourceId = (
					await createSource(db, null, {
						dataProviderShortCode: firstDataProvider.shortCode,
						label: `${firstDataProvider.name} source`,
					})
				).id;
				secondDataProviderSourceId = (
					await createSource(db, null, {
						dataProviderShortCode: secondDataProvider.shortCode,
						label: `${secondDataProvider.name} source`,
					})
				).id;
			});

			it('returns the latest valid value for a base field when auth id is sent', async () => {
				// Associate a base field associated with one opportunity/org, and add three responses.
				const baseFieldId = baseFieldEmail.id;
				const changemakerId = firstChangemaker.id;
				const opportunityId = firstFunderOpportunity.id;
				const proposalId = (
					await createProposal(db, null, {
						opportunityId,
						externalId: 'Proposal',
						createdBy: systemUser.keycloakUserId,
					})
				).id;
				await createChangemakerProposal(db, null, {
					changemakerId,
					proposalId,
				});
				// I need 3 application form fields here. May as well make them use distinct forms too.
				const applicationFormIdEarliest = (
					await createApplicationForm(db, null, {
						opportunityId,
					})
				).id;
				// Older field that is valid
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, null, {
							proposalId,
							applicationFormId: applicationFormIdEarliest,
							sourceId: systemSource.id,
							createdBy: systemUser.keycloakUserId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
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
					await createApplicationForm(db, null, {
						opportunityId,
					})
				).id;
				const latestValidValue = await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, null, {
							proposalId,
							applicationFormId: applicationFormIdLatestValid,
							sourceId: systemSource.id,
							createdBy: systemUser.keycloakUserId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
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
					await createApplicationForm(db, null, {
						opportunityId,
					})
				).id;
				// Latest value but invalid
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, null, {
							proposalId,
							applicationFormId: applicationFormIdLatest,
							sourceId: systemSource.id,
							createdBy: systemUser.keycloakUserId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
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
					.get(`/changemakers/${changemakerId}`)
					.set(authHeader)
					.expect(200)
					.expect((res) =>
						expect(res.body).toEqual({
							id: changemakerId,
							name: 'Five thousand one hundred forty seven reasons',
							taxId: '05119',
							keycloakOrganizationId: null,
							createdAt: expectTimestamp,
							fields: [latestValidValue],
						}),
					);
			});

			it('returns older changemaker data when newer funder data is present', async () => {
				// Set up changemaker and funder sources.
				const changemaker = secondChangemaker;
				const changemakerSourceId = secondChangemakerSourceId;
				const funderSourceId = firstFunderSourceId;
				// Associate one opportunity, one changemaker, and two responses with a base field.
				const baseFieldId = baseFieldPhone.id;
				const opportunity = firstFunderOpportunity;
				const proposalId = (
					await createProposal(db, null, {
						opportunityId: opportunity.id,
						externalId: `Proposal to ${opportunity.title}`,
						createdBy: systemUser.keycloakUserId,
					})
				).id;
				await createChangemakerProposal(db, null, {
					changemakerId: changemaker.id,
					proposalId,
				});
				const applicationFormIdChangemakerEarliest = (
					await createApplicationForm(db, null, {
						opportunityId: opportunity.id,
					})
				).id;
				// Set up older field value that is from the changemaker. We'll expect this to be returned.
				const changemakerEarliestValue = await createProposalFieldValue(
					db,
					null,
					{
						proposalVersionId: (
							await createProposalVersion(db, null, {
								proposalId,
								applicationFormId: applicationFormIdChangemakerEarliest,
								sourceId: changemakerSourceId,
								createdBy: systemUser.keycloakUserId,
							})
						).id,
						applicationFormFieldId: (
							await createApplicationFormField(db, null, {
								label: 'Org phone',
								applicationFormId: applicationFormIdChangemakerEarliest,
								baseFieldId,
								position: 5407,
							})
						).id,
						position: 5413,
						value: '+15555555555',
						isValid: true,
					},
				);
				const applicationFormIdFunderLatest = (
					await createApplicationForm(db, null, {
						opportunityId: opportunity.id,
					})
				).id;
				// Set up newer field value that is from the funder.
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, null, {
							proposalId,
							applicationFormId: applicationFormIdFunderLatest,
							sourceId: funderSourceId,
							createdBy: systemUser.keycloakUserId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
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
					.get(`/changemakers/${changemaker.id}`)
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

			it('returns older funder data when newer data platform provider data is present', async () => {
				// Set up funder and data platform provider sources.
				const changemaker = secondChangemaker;
				const funderSourceId = firstFunderSourceId;
				const dataProviderSourceId = firstDataProviderSourceId;
				// Associate one opportunity, one changemaker, and two responses with a base field.
				const baseFieldId = baseFieldPhone.id;
				const opportunity = firstFunderOpportunity;
				const proposalId = (
					await createProposal(db, null, {
						opportunityId: opportunity.id,
						externalId: `Another proposal to ${opportunity.title}`,
						createdBy: systemUser.keycloakUserId,
					})
				).id;
				await createChangemakerProposal(db, null, {
					changemakerId: changemaker.id,
					proposalId,
				});
				const applicationFormIdFunderEarliest = (
					await createApplicationForm(db, null, {
						opportunityId: opportunity.id,
					})
				).id;
				// Set up older field value that is from the funder. We'll expect this to be returned.
				const funderEarliestValue = await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, null, {
							proposalId,
							applicationFormId: applicationFormIdFunderEarliest,
							sourceId: funderSourceId,
							createdBy: systemUser.keycloakUserId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Organization phone 5437',
							applicationFormId: applicationFormIdFunderEarliest,
							baseFieldId,
							position: 5437,
						})
					).id,
					position: 5441,
					value: '+15555555441',
					isValid: true,
				});
				const applicationFormIdDataProviderLatest = (
					await createApplicationForm(db, null, {
						opportunityId: opportunity.id,
					})
				).id;
				// Set up newer field value that is from the data platform provider.
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, null, {
							proposalId,
							applicationFormId: applicationFormIdDataProviderLatest,
							sourceId: dataProviderSourceId,
							createdBy: systemUser.keycloakUserId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Phone contact',
							applicationFormId: applicationFormIdDataProviderLatest,
							baseFieldId,
							position: 5443,
						})
					).id,
					position: 5449,
					value: '+16666665449',
					isValid: true,
				});
				await request(app)
					.get(`/changemakers/${changemaker.id}`)
					.set(authHeader)
					.expect(200)
					.expect((res) =>
						expect(res.body).toEqual({
							...changemaker,
							createdAt: expectTimestamp,
							fields: [funderEarliestValue],
						}),
					);
			});

			it('returns newer data when only data platform provider data is present', async () => {
				const changemaker = secondChangemaker;
				// Set up data platform provider sources.
				// Associate one opportunity, one changemaker, and two responses with a base field.
				const proposalId = (
					await createProposal(db, null, {
						opportunityId: firstFunderOpportunity.id,
						externalId: `Yet another proposal to ${firstFunderOpportunity.title}`,
						createdBy: systemUser.keycloakUserId,
					})
				).id;
				await createChangemakerProposal(db, null, {
					changemakerId: changemaker.id,
					proposalId,
				});
				const applicationFormIdDataProviderEarliest = (
					await createApplicationForm(db, null, {
						opportunityId: firstFunderOpportunity.id,
					})
				).id;
				// Set up older field value.
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, null, {
							proposalId,
							applicationFormId: applicationFormIdDataProviderEarliest,
							sourceId: firstDataProviderSourceId,
							createdBy: systemUser.keycloakUserId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Organization website 5479',
							applicationFormId: applicationFormIdDataProviderEarliest,
							baseFieldId: baseFieldWebsite.id,
							position: 5479,
						})
					).id,
					position: 5483,
					value: '+15555555483',
					isValid: true,
				});
				const applicationFormIdDataProviderLatest = (
					await createApplicationForm(db, null, {
						opportunityId: firstFunderOpportunity.id,
					})
				).id;
				// Set up newer field value.
				const dataProviderNewestValue = await createProposalFieldValue(
					db,
					null,
					{
						proposalVersionId: (
							await createProposalVersion(db, null, {
								proposalId,
								applicationFormId: applicationFormIdDataProviderLatest,
								sourceId: secondDataProviderSourceId,
								createdBy: systemUser.keycloakUserId,
							})
						).id,
						applicationFormFieldId: (
							await createApplicationFormField(db, null, {
								label: 'Phone contact',
								applicationFormId: applicationFormIdDataProviderLatest,
								baseFieldId: baseFieldWebsite.id,
								position: 5501,
							})
						).id,
						position: 5503,
						value: '+16666665503',
						isValid: true,
					},
				);
				await request(app)
					.get(`/changemakers/${changemaker.id}`)
					.set(authHeader)
					.expect(200)
					.expect((res) =>
						expect(res.body).toEqual({
							...changemaker,
							createdAt: expectTimestamp,
							fields: [dataProviderNewestValue],
						}),
					);
			});
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/changemakers').expect(401);
		});

		it('creates exactly one changemaker', async () => {
			const before = await loadTableMetrics('changemakers');
			const result = await request(app)
				.post('/changemakers')
				.type('application/json')
				.set(authHeader)
				.send({
					taxId: '11-1111111',
					name: 'Example Inc.',
					keycloakOrganizationId: null,
				})
				.expect(201);
			const after = await loadTableMetrics('changemakers');
			expect(before.count).toEqual(0);
			expect(result.body).toStrictEqual({
				id: 1,
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
				createdAt: expectTimestamp,
				fields: [],
			});
			expect(after.count).toEqual(1);
		});

		it('returns 400 bad request when no taxId is sent', async () => {
			const result = await request(app)
				.post('/changemakers')
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
				.post('/changemakers')
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
			await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Example Inc.',
				keycloakOrganizationId: null,
			});
			const result = await request(app)
				.post('/changemakers')
				.type('application/json')
				.set(authHeader)
				.send({
					taxId: '11-1111111',
					name: 'Example Inc.',
					keycloakOrganizationId: null,
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

	describe('PATCH /:id', () => {
		it('Successfully sets a keycloakOrganizationId where previously null', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '0413938240766429660404877575834592091277',
				name: 'Changemaker 0413938240766429660404877575834592091277',
				keycloakOrganizationId: null,
			});
			const newOrganizationId = stringToKeycloakId(
				'aa2e4ed0-3c67-4d29-9bd0-2fb13f95d420',
			);
			const result = await request(app)
				.patch(`/changemakers/${changemaker.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					keycloakOrganizationId: newOrganizationId,
				})
				.expect(200);
			expect(result.body).toStrictEqual({
				...changemaker,
				keycloakOrganizationId: newOrganizationId,
				createdAt: expectTimestamp,
				fields: [],
			});
		});

		it('Successfully changes a taxId', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '9804410587598905789786443694633460095646',
				name: 'Changemaker with changing tax ID',
				keycloakOrganizationId: null,
			});
			const newTaxId = '7595152072656722360933945510658631139960';
			const result = await request(app)
				.patch(`/changemakers/${changemaker.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					taxId: newTaxId,
				})
				.expect(200);
			expect(result.body).toStrictEqual({
				...changemaker,
				taxId: newTaxId,
				createdAt: expectTimestamp,
				fields: [],
			});
		});

		it('Successfully changes a name and Keycloak organization ID', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '0589037839239992596491929160281098521279',
				name: 'Whoops, a bad name here',
				keycloakOrganizationId: stringToKeycloakId(
					'd32693c1-d8de-40a3-8de9-a84f0737f015',
				),
			});
			const newChangemakerFields = {
				keycloakOrganizationId: stringToKeycloakId(
					'bd2c3e40-74ee-4cdb-b025-44d897970fb6',
				),
				name: 'Changemaker 0589037839239992596491929160281098521279',
			};
			const result = await request(app)
				.patch(`/changemakers/${changemaker.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send(newChangemakerFields)
				.expect(200);
			expect(result.body).toStrictEqual({
				...newChangemakerFields,
				id: changemaker.id,
				taxId: changemaker.taxId,
				createdAt: expectTimestamp,
				fields: [],
			});
		});

		it('Returns 404 when changemaker is not found', async () => {
			const newChangemakerFields = {
				keycloakOrganizationId: stringToKeycloakId(
					'd064b254-ea77-4f12-9ab3-eda695480e93',
				),
				name: 'Changemaker 5121900900194636437083568517070852137161',
			};
			const result = await request(app)
				.patch(`/changemakers/58597992`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send(newChangemakerFields)
				.expect(404);
			expect(result.body).toMatchObject({
				name: 'NotFoundError',
				details: expect.any(Array) as unknown[],
			});
		});

		it('Requires authentication', async () => {
			await request(app)
				.patch('/changemakers/36033573')
				.type('application/json')
				.send({ taxId: '5940750525594199732476921580223828135369' })
				.expect(401);
		});

		it('Requires administrator role', async () => {
			await request(app)
				.patch('/changemakers/67349073')
				.type('application/json')
				.set(authHeader)
				.send({ name: '7404171616851845629932178083729587457161' })
				.expect(401);
		});

		it('Requires integer changemaker ID', async () => {
			await request(app)
				.patch('/changemakers/not_a_valid_id')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({ taxId: '2257341433176036791749929003823780328760' })
				.expect(400);
		});

		it('Returns user error on non-updatable fields on changemaker', async () => {
			await request(app)
				.patch('/changemakers/560580')
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					id: 560580,
					fields: [],
				})
				.expect(400);
		});

		it('Returns user error when no fields are sent', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '4200940637362024164716787854746203032491',
				name: 'Changemaker 4200940637362024164716787854746203032491',
				keycloakOrganizationId: stringToKeycloakId(
					'5533ace6-d60d-4da0-9dfd-fbcec0a4fdf8',
				),
			});
			await request(app)
				.patch(`/changemakers/${changemaker.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({})
				.expect(400);
		});
	});
});
