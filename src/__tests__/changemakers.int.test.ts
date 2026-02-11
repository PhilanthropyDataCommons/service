import request from 'supertest';
import { app } from '../app';
import {
	db,
	createApplicationForm,
	createApplicationFormField,
	createOrUpdateBaseField,
	createOpportunity,
	createChangemaker,
	createChangemakerFieldValue,
	createChangemakerFieldValueBatch,
	createChangemakerProposal,
	createOrUpdateFunder,
	createPermissionGrant,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	createSource,
	loadSystemSource,
	loadSystemUser,
	loadTableMetrics,
	createOrUpdateDataProvider,
	loadSystemFunder,
} from '../database';
import {
	getAuthContext,
	getTestUserKeycloakUserId,
	loadTestUser,
} from '../test/utils';
import { createTestFile } from '../test/factories';
import {
	expectArray,
	expectArrayContaining,
	expectObjectContaining,
	expectString,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as adminUserAuthHeader,
} from '../test/mockJwt';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
	PostgresErrorCode,
	stringToKeycloakId,
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

const setupTestContext = async () => {
	const systemSource = await loadSystemSource(db, null);
	const systemUser = await loadSystemUser(db, null);
	const systemUserAuthContext = getAuthContext(systemUser, true);
	const testUser = await loadTestUser();
	const baseFieldEmail = await createOrUpdateBaseField(db, null, {
		label: 'Fifty one fifty three',
		shortCode: 'fifty_one_fifty_three',
		description: 'Five thousand one hundred fifty three.',
		dataType: BaseFieldDataType.EMAIL,
		category: BaseFieldCategory.ORGANIZATION,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
	const baseFieldPhone = await createOrUpdateBaseField(db, null, {
		label: 'Fifty three ninety nine',
		shortCode: 'fifty_three_ninety_nine',
		description: 'Five thousand three hundred ninety nine.',
		dataType: BaseFieldDataType.PHONE_NUMBER,
		category: BaseFieldCategory.ORGANIZATION,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
	const baseFieldWebsite = await createOrUpdateBaseField(db, null, {
		label: 'Fifty four seventy one 5471',
		shortCode: 'fifty_four_seventy_one',
		description: 'Five thousand four hundred seventy one.',
		dataType: BaseFieldDataType.URL,
		category: BaseFieldCategory.ORGANIZATION,
		valueRelevanceHours: null,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
	});
	const firstChangemaker = await createChangemaker(db, null, {
		name: 'Five thousand one hundred forty seven reasons',
		taxId: '05119',
		keycloakOrganizationId: null,
	});
	const secondChangemaker = await createChangemaker(db, null, {
		taxId: '5387',
		name: 'Changemaker 5387',
		keycloakOrganizationId: '8b15d276-be48-11ef-a061-5b4a50e82d50',
	});
	const { id: secondChangemakerSourceId } = await createSource(db, null, {
		changemakerId: secondChangemaker.id,
		label: `${secondChangemaker.name} source`,
	});
	const firstFunder = await createOrUpdateFunder(db, null, {
		shortCode: 'funder_5393',
		name: 'Funder 5393',
		keycloakOrganizationId: null,
		isCollaborative: false,
	});

	// Grant test user permission to view proposal field values for this funder
	await createPermissionGrant(db, systemUserAuthContext, {
		granteeType: PermissionGrantGranteeType.USER,
		granteeUserKeycloakUserId: testUser.keycloakUserId,
		contextEntityType: PermissionGrantEntityType.FUNDER,
		funderShortCode: firstFunder.shortCode,
		scope: [
			PermissionGrantEntityType.PROPOSAL,
			PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
		],
		verbs: [PermissionGrantVerb.VIEW],
	});

	const firstFunderOpportunity = await createOpportunity(db, null, {
		title: `${firstFunder.name} opportunity`,
		funderShortCode: firstFunder.shortCode,
	});
	const { id: firstFunderSourceId } = await createSource(db, null, {
		funderShortCode: firstFunder.shortCode,
		label: `${firstFunder.name} source`,
	});
	const firstDataProvider = await createOrUpdateDataProvider(db, null, {
		shortCode: 'data_provider_5431',
		name: 'Data Platform Provider 5431',
		keycloakOrganizationId: null,
	});
	const secondDataProvider = await createOrUpdateDataProvider(db, null, {
		shortCode: 'data_provider_5477',
		name: 'Data Platform Provider 5477',
		keycloakOrganizationId: null,
	});
	const { id: firstDataProviderSourceId } = await createSource(db, null, {
		dataProviderShortCode: firstDataProvider.shortCode,
		label: `${firstDataProvider.name} source`,
	});
	const { id: secondDataProviderSourceId } = await createSource(db, null, {
		dataProviderShortCode: secondDataProvider.shortCode,
		label: `${secondDataProvider.name} source`,
	});

	return {
		systemSource,
		systemUser,
		systemUserAuthContext,
		baseFieldEmail,
		baseFieldPhone,
		baseFieldWebsite,
		firstChangemaker,
		secondChangemaker,
		secondChangemakerSourceId,
		firstFunder,
		firstFunderOpportunity,
		firstFunderSourceId,
		firstDataProvider,
		firstDataProviderSourceId,
		secondDataProvider,
		secondDataProviderSourceId,
	};
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
				.expect((res) => {
					expect(res.body).toEqual({
						total: 2,
						entries: [
							{
								id: 2,
								taxId: '22-2222222',
								name: 'Another Inc.',
								keycloakOrganizationId: '57ceaca8-be48-11ef-8c91-5732d98a77e1',
								createdAt: expectTimestamp(),
								fiscalSponsors: [],
								fields: [],
							},
							{
								id: 1,
								taxId: '11-1111111',
								name: 'Example Inc.',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp(),
								fiscalSponsors: [],
								fields: [],
							},
						],
					});
				});
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
				.expect((res) => {
					expect(res.body).toEqual({
						total: 20,
						entries: [
							{
								id: 15,
								taxId: '11-1111111',
								name: 'Changemaker 15',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp(),
								fiscalSponsors: [],
								fields: [],
							},
							{
								id: 14,
								taxId: '11-1111111',
								name: 'Changemaker 14',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp(),
								fiscalSponsors: [],
								fields: [],
							},
							{
								id: 13,
								taxId: '11-1111111',
								name: 'Changemaker 13',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp(),
								fiscalSponsors: [],
								fields: [],
							},
							{
								id: 12,
								taxId: '11-1111111',
								name: 'Changemaker 12',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp(),
								fiscalSponsors: [],
								fields: [],
							},
							{
								id: 11,
								taxId: '11-1111111',
								name: 'Changemaker 11',
								keycloakOrganizationId: null,
								createdAt: expectTimestamp(),
								fiscalSponsors: [],
								fields: [],
							},
						],
					});
				});
		});

		it('returns a subset of changemakers present in the database when a proposal filter is provided', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
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
						createdAt: expectTimestamp(),
						fiscalSponsors: [],
						fields: [],
					},
				],
			});
		});

		it('does not return duplicate changemakers when a changemaker has multiple proposals', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-1',
				opportunityId: 1,
			});
			await createProposal(db, testUserAuthContext, {
				externalId: 'proposal-2',
				opportunityId: 1,
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
						createdAt: expectTimestamp(),
						fiscalSponsors: [],
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
				message: expectString(),
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
				.expect((res) => {
					expect(res.body).toEqual({
						id: 2,
						taxId: '22-2222222',
						name: 'Another Inc.',
						keycloakOrganizationId: '57ceaca8-be48-11ef-8c91-5732d98a77e1',
						createdAt: expectTimestamp(),
						fiscalSponsors: [],
						fields: [],
					});
				});
		});

		it('returns a 400 bad request when a non-integer ID is sent', async () => {
			await request(app).get('/changemakers/foo').set(authHeader).expect(400);
		});

		it('returns 400 bad request when an int between 2^31 to 2^32 is sent', async () => {
			await request(app)
				.get('/changemakers/3147483648')
				.set(authHeader)
				.expect(400);
		});

		describe('tests that find gold data among proposals and share a common db', () => {
			it('returns the latest valid value for a base field when auth id is sent', async () => {
				const {
					firstChangemaker,
					firstFunderOpportunity,
					baseFieldEmail,
					systemUserAuthContext,
					systemSource,
				} = await setupTestContext();
				// Associate a base field associated with one opportunity/org, and add three responses.
				const { shortCode: baseFieldShortCode } = baseFieldEmail;
				const { id: changemakerId } = firstChangemaker;
				const { id: opportunityId } = firstFunderOpportunity;
				const { id: proposalId } = await createProposal(
					db,
					systemUserAuthContext,
					{
						opportunityId,
						externalId: 'Proposal',
					},
				);
				await createChangemakerProposal(db, null, {
					changemakerId,
					proposalId,
				});
				// I need 3 application form fields here. May as well make them use distinct forms too.
				const { id: applicationFormIdEarliest } = await createApplicationForm(
					db,
					null,
					{
						opportunityId,
						name: null,
					},
				);
				// Older field that is valid
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, systemUserAuthContext, {
							proposalId,
							applicationFormId: applicationFormIdEarliest,
							sourceId: systemSource.id,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Org email',
							applicationFormId: applicationFormIdEarliest,
							baseFieldShortCode,
							position: 5279,
							instructions:
								'Please enter the email address of the organization.',
						})
					).id,
					position: 5297,
					value: 'validbutold@emailaddress.com',
					isValid: true,
					goodAsOf: null,
				});
				const { id: applicationFormIdLatestValid } =
					await createApplicationForm(db, null, {
						opportunityId,
						name: null,
					});
				const latestValidValue = await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, systemUserAuthContext, {
							proposalId,
							applicationFormId: applicationFormIdLatestValid,
							sourceId: systemSource.id,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Email contact',
							applicationFormId: applicationFormIdLatestValid,
							baseFieldShortCode,
							position: 5347,
							instructions:
								'Please enter the email address of the organization.',
						})
					).id,
					position: 5381,
					value: 'valid@emailaddress.com',
					isValid: true,
					goodAsOf: null,
				});
				const { id: applicationFormIdLatest } = await createApplicationForm(
					db,
					null,
					{
						opportunityId,
						name: null,
					},
				);
				// Latest value but invalid
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, systemUserAuthContext, {
							proposalId,
							applicationFormId: applicationFormIdLatest,
							sourceId: systemSource.id,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Contact email address',
							applicationFormId: applicationFormIdLatest,
							baseFieldShortCode,
							position: 5209,
							instructions:
								'Please enter the email address of the organization.',
						})
					).id,
					position: 5231,
					value: 'invalid-email-address.com',
					isValid: false,
					goodAsOf: null,
				});
				await request(app)
					.get(`/changemakers/${changemakerId}`)
					.set(authHeader)
					.expect(200)
					.expect((res) => {
						expect(res.body).toEqual({
							id: changemakerId,
							name: 'Five thousand one hundred forty seven reasons',
							taxId: '05119',
							keycloakOrganizationId: null,
							createdAt: expectTimestamp(),
							fiscalSponsors: [],
							fields: [latestValidValue],
						});
					});
			});

			it('returns older changemaker data when newer funder data is present', async () => {
				const {
					secondChangemaker: changemaker,
					secondChangemakerSourceId: changemakerSourceId,
					firstFunderSourceId: funderSourceId,
					firstFunderOpportunity: opportunity,
					baseFieldPhone,
					systemUserAuthContext,
				} = await setupTestContext();

				const { shortCode: baseFieldShortCode } = baseFieldPhone;
				const { id: proposalId } = await createProposal(
					db,
					systemUserAuthContext,
					{
						opportunityId: opportunity.id,
						externalId: `Proposal to ${opportunity.title}`,
					},
				);
				await createChangemakerProposal(db, null, {
					changemakerId: changemaker.id,
					proposalId,
				});
				const { id: applicationFormIdChangemakerEarliest } =
					await createApplicationForm(db, null, {
						opportunityId: opportunity.id,
						name: null,
					});
				// Set up older field value that is from the changemaker. We'll expect this to be returned.
				const changemakerEarliestValue = await createProposalFieldValue(
					db,
					null,
					{
						proposalVersionId: (
							await createProposalVersion(db, systemUserAuthContext, {
								proposalId,
								applicationFormId: applicationFormIdChangemakerEarliest,
								sourceId: changemakerSourceId,
							})
						).id,
						applicationFormFieldId: (
							await createApplicationFormField(db, null, {
								label: 'Org phone',
								applicationFormId: applicationFormIdChangemakerEarliest,
								baseFieldShortCode,
								position: 5407,
								instructions:
									'Please enter the phone number of the organization.',
							})
						).id,
						position: 5413,
						value: '+15555555555',
						isValid: true,
						goodAsOf: null,
					},
				);
				const { id: applicationFormIdFunderLatest } =
					await createApplicationForm(db, null, {
						opportunityId: opportunity.id,
						name: null,
					});
				// Set up newer field value that is from the funder.
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, systemUserAuthContext, {
							proposalId,
							applicationFormId: applicationFormIdFunderLatest,
							sourceId: funderSourceId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Phone contact',
							applicationFormId: applicationFormIdFunderLatest,
							baseFieldShortCode,
							position: 5417,
							instructions:
								'Please enter the phone number of the organization.',
						})
					).id,
					position: 5419,
					value: '+16666666666',
					isValid: true,
					goodAsOf: null,
				});
				await request(app)
					.get(`/changemakers/${changemaker.id}`)
					.set(authHeader)
					.expect(200)
					.expect((res) => {
						expect(res.body).toEqual({
							...changemaker,
							createdAt: expectTimestamp(),
							fields: [changemakerEarliestValue],
						});
					});
			});

			it('returns older funder data when newer data platform provider data is present', async () => {
				const {
					secondChangemaker: changemaker,
					firstFunderSourceId: funderSourceId,
					firstDataProviderSourceId: dataProviderSourceId,
					baseFieldPhone,
					firstFunderOpportunity: opportunity,
					systemUserAuthContext,
				} = await setupTestContext();

				const { shortCode: baseFieldShortCode } = baseFieldPhone;
				const { id: proposalId } = await createProposal(
					db,
					systemUserAuthContext,
					{
						opportunityId: opportunity.id,
						externalId: `Another proposal to ${opportunity.title}`,
					},
				);
				await createChangemakerProposal(db, null, {
					changemakerId: changemaker.id,
					proposalId,
				});
				const { id: applicationFormIdFunderEarliest } =
					await createApplicationForm(db, null, {
						opportunityId: opportunity.id,
						name: null,
					});
				// Set up older field value that is from the funder. We'll expect this to be returned.
				const funderEarliestValue = await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, systemUserAuthContext, {
							proposalId,
							applicationFormId: applicationFormIdFunderEarliest,
							sourceId: funderSourceId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Organization phone 5437',
							applicationFormId: applicationFormIdFunderEarliest,
							baseFieldShortCode,
							position: 5437,
							instructions:
								'Please enter the phone number of the organization.',
						})
					).id,
					position: 5441,
					value: '+15555555441',
					isValid: true,
					goodAsOf: null,
				});
				const { id: applicationFormIdDataProviderLatest } =
					await createApplicationForm(db, null, {
						opportunityId: opportunity.id,
						name: null,
					});
				// Set up newer field value that is from the data platform provider.
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, systemUserAuthContext, {
							proposalId,
							applicationFormId: applicationFormIdDataProviderLatest,
							sourceId: dataProviderSourceId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Phone contact',
							applicationFormId: applicationFormIdDataProviderLatest,
							baseFieldShortCode,
							position: 5443,
							instructions:
								'Please enter the phone number of the organization.',
						})
					).id,
					position: 5449,
					value: '+16666665449',
					isValid: true,
					goodAsOf: null,
				});
				await request(app)
					.get(`/changemakers/${changemaker.id}`)
					.set(authHeader)
					.expect(200)
					.expect((res) => {
						expect(res.body).toEqual({
							...changemaker,
							createdAt: expectTimestamp(),
							fields: [funderEarliestValue],
						});
					});
			});

			it('returns newer data when only data platform provider data is present', async () => {
				const {
					secondChangemaker: changemaker,
					systemUserAuthContext,
					firstFunderOpportunity,
					firstDataProviderSourceId,
					baseFieldWebsite,
					secondDataProviderSourceId,
				} = await setupTestContext();

				// Set up data platform provider sources.
				// Associate one opportunity, one changemaker, and two responses with a base field.
				const { id: proposalId } = await createProposal(
					db,
					systemUserAuthContext,
					{
						opportunityId: firstFunderOpportunity.id,
						externalId: `Yet another proposal to ${firstFunderOpportunity.title}`,
					},
				);
				await createChangemakerProposal(db, null, {
					changemakerId: changemaker.id,
					proposalId,
				});
				const { id: applicationFormIdDataProviderEarliest } =
					await createApplicationForm(db, null, {
						opportunityId: firstFunderOpportunity.id,
						name: null,
					});
				// Set up older field value.
				await createProposalFieldValue(db, null, {
					proposalVersionId: (
						await createProposalVersion(db, systemUserAuthContext, {
							proposalId,
							applicationFormId: applicationFormIdDataProviderEarliest,
							sourceId: firstDataProviderSourceId,
						})
					).id,
					applicationFormFieldId: (
						await createApplicationFormField(db, null, {
							label: 'Organization website 5479',
							applicationFormId: applicationFormIdDataProviderEarliest,
							baseFieldShortCode: baseFieldWebsite.shortCode,
							position: 5479,
							instructions: 'Please enter the website of the organization.',
						})
					).id,
					position: 5483,
					value: '+15555555483',
					isValid: true,
					goodAsOf: null,
				});
				const { id: applicationFormIdDataProviderLatest } =
					await createApplicationForm(db, null, {
						opportunityId: firstFunderOpportunity.id,
						name: null,
					});
				// Set up newer field value.
				const dataProviderNewestValue = await createProposalFieldValue(
					db,
					null,
					{
						proposalVersionId: (
							await createProposalVersion(db, systemUserAuthContext, {
								proposalId,
								applicationFormId: applicationFormIdDataProviderLatest,
								sourceId: secondDataProviderSourceId,
							})
						).id,
						applicationFormFieldId: (
							await createApplicationFormField(db, null, {
								label: 'Phone contact',
								applicationFormId: applicationFormIdDataProviderLatest,
								baseFieldShortCode: baseFieldWebsite.shortCode,
								position: 5501,
								instructions: 'Please enter the website of the organization.',
							})
						).id,
						position: 5503,
						value: '+16666665503',
						isValid: true,
						goodAsOf: null,
					},
				);
				await request(app)
					.get(`/changemakers/${changemaker.id}`)
					.set(authHeader)
					.expect(200)
					.expect((res) => {
						expect(res.body).toEqual({
							...changemaker,
							createdAt: expectTimestamp(),
							fields: [dataProviderNewestValue],
						});
					});
			});

			it('does not return forbidden base field data', async () => {
				const {
					secondChangemaker: changemaker,
					systemUserAuthContext,
					firstFunderOpportunity,
					firstFunderSourceId: funderSourceId,
				} = await setupTestContext();

				const forbiddenBaseField = await createOrUpdateBaseField(db, null, {
					label: 'Forbidden Field',
					shortCode: 'forbiddenField',
					description: 'This field is forbidden',
					sensitivityClassification:
						BaseFieldSensitivityClassification.RESTRICTED,
					dataType: BaseFieldDataType.STRING,
					valueRelevanceHours: null,
					category: BaseFieldCategory.ORGANIZATION,
				});
				const opportunity = firstFunderOpportunity;
				const proposal = await createProposal(db, systemUserAuthContext, {
					opportunityId: opportunity.id,
					externalId: `Another proposal to ${opportunity.title}`,
				});
				await createChangemakerProposal(db, null, {
					changemakerId: changemaker.id,
					proposalId: proposal.id,
				});
				const applicationForm = await createApplicationForm(db, null, {
					opportunityId: opportunity.id,
					name: null,
				});
				const applicationFormField = await createApplicationFormField(
					db,
					null,
					{
						label: 'Forbidden',
						applicationFormId: applicationForm.id,
						baseFieldShortCode: forbiddenBaseField.shortCode,
						position: 1,
						instructions: 'Please enter the forbidden field.',
					},
				);
				const proposalVersion = await createProposalVersion(
					db,
					systemUserAuthContext,
					{
						proposalId: proposal.id,
						applicationFormId: applicationForm.id,
						sourceId: funderSourceId,
					},
				);
				await createProposalFieldValue(db, null, {
					proposalVersionId: proposalVersion.id,
					applicationFormFieldId: applicationFormField.id,
					position: 1,
					value: 'foo',
					isValid: true,
					goodAsOf: null,
				});
				await createOrUpdateBaseField(db, null, {
					...forbiddenBaseField,
					sensitivityClassification:
						BaseFieldSensitivityClassification.FORBIDDEN,
				});

				await request(app)
					.get(`/changemakers/${changemaker.id}`)
					.set(authHeader)
					.expect(200)
					.expect((res) => {
						expect(res.body).toEqual({
							...changemaker,
							createdAt: expectTimestamp(),
							fields: [],
						});
					});
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
				createdAt: expectTimestamp(),
				fiscalSponsors: [],
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
				details: expectArray(),
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
				details: expectArray(),
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
				createdAt: expectTimestamp(),
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
				createdAt: expectTimestamp(),
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
				createdAt: expectTimestamp(),
				fiscalSponsors: [],
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
				details: expectArray(),
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

		it('Returns 400 validation error when taxId is set to null', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '1234567890',
				name: 'Test Changemaker',
				keycloakOrganizationId: null,
			});
			const result = await request(app)
				.patch(`/changemakers/${changemaker.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					taxId: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('Returns 400 validation error when name is set to null', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '0987654321',
				name: 'Another Test Changemaker',
				keycloakOrganizationId: null,
			});
			const result = await request(app)
				.patch(`/changemakers/${changemaker.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					name: null,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('Successfully sets keycloakOrganizationId to null', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '5555555555',
				name: 'Changemaker with org id',
				keycloakOrganizationId: stringToKeycloakId(
					'12345678-1234-1234-1234-123456789abc',
				),
			});
			const result = await request(app)
				.patch(`/changemakers/${changemaker.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send({
					keycloakOrganizationId: null,
				})
				.expect(200);
			expect(result.body).toStrictEqual({
				...changemaker,
				keycloakOrganizationId: null,
			});
		});
	});

	describe('PUT /:changemakerId/fiscalSponsors/:fiscalSponsorChangemakerId', () => {
		it('Successfully adds and reflects two fiscal sponsorships', async () => {
			const fiscalSponsee = await createChangemaker(db, null, {
				taxId: '5081291550860062107766631030417388169256',
				name: 'Sponsee 5081291550860062107766631030417388169256',
				keycloakOrganizationId: null,
			});
			const fiscalSponsor = await createChangemaker(db, null, {
				taxId: '0118304041375623758777905068103837593356',
				name: 'Sponsor 0118304041375623758777905068103837593356',
				keycloakOrganizationId: null,
			});
			const fiscalSponsorTwo = await createChangemaker(db, null, {
				taxId: '8533165123659550499871910387521368428424',
				name: 'Sponsor 8533165123659550499871910387521368428424',
				keycloakOrganizationId: null,
			});
			const result = await request(app)
				.put(
					`/changemakers/${fiscalSponsee.id}/fiscalSponsors/${fiscalSponsor.id}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(200);
			expect(result.body).toStrictEqual({
				fiscalSponseeChangemakerId: fiscalSponsee.id,
				fiscalSponsorChangemakerId: fiscalSponsor.id,
				createdAt: expectTimestamp(),
				createdBy: getTestUserKeycloakUserId(),
				notAfter: null,
			});
			const resultTwo = await request(app)
				.put(
					`/changemakers/${fiscalSponsee.id}/fiscalSponsors/${fiscalSponsorTwo.id}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(200);
			expect(resultTwo.body).toStrictEqual({
				fiscalSponseeChangemakerId: fiscalSponsee.id,
				fiscalSponsorChangemakerId: fiscalSponsorTwo.id,
				createdAt: expectTimestamp(),
				createdBy: getTestUserKeycloakUserId(),
				notAfter: null,
			});
			const changemakerResult = await request(app)
				.get(`/changemakers/${fiscalSponsee.id}`)
				.set(adminUserAuthHeader)
				.expect(200);
			expect(changemakerResult.body).toStrictEqual({
				...fiscalSponsee,
				createdAt: expectTimestamp(),
				fiscalSponsors: [
					{
						id: fiscalSponsor.id,
						taxId: fiscalSponsor.taxId,
						name: fiscalSponsor.name,
						keycloakOrganizationId: fiscalSponsor.keycloakOrganizationId,
						createdAt: fiscalSponsor.createdAt,
					},
					{
						id: fiscalSponsorTwo.id,
						taxId: fiscalSponsorTwo.taxId,
						name: fiscalSponsorTwo.name,
						keycloakOrganizationId: fiscalSponsorTwo.keycloakOrganizationId,
						createdAt: fiscalSponsorTwo.createdAt,
					},
				],
			});
		});

		it('Requires authentication', async () => {
			const fiscalSponsee = await createChangemaker(db, null, {
				taxId: '2931491497481164952498947862581097119543',
				name: 'Sponsee 2931491497481164952498947862581097119543',
				keycloakOrganizationId: null,
			});
			const fiscalSponsor = await createChangemaker(db, null, {
				taxId: '1760370275937448424960420855817329405546',
				name: 'Sponsor 1760370275937448424960420855817329405546',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/changemakers/${fiscalSponsee.id}/fiscalSponsors/${fiscalSponsor.id}`,
				)
				.type('application/json')
				.send()
				.expect(401);
		});

		it('Requires sponsor to differ from sponsee', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '6662026305156335697506682975139641746440',
				name: 'Changemaker 6662026305156335697506682975139641746440',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(`/changemakers/${changemaker.id}/fiscalSponsors/${changemaker.id}`)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(400);
		});

		it('Requires integer fiscal sponsee changemaker ID', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '9185467240703696384011509519069015034382',
				name: 'Changemaker 9185467240703696384011509519069015034382',
				keycloakOrganizationId: null,
			});
			const fiscalSponsor = await createChangemaker(db, null, {
				taxId: '9543545368164071044940139233866036020587',
				name: 'Changemaker 9543545368164071044940139233866036020587',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/changemakers/${changemaker.name}/fiscalSponsors/${fiscalSponsor.id}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(400);
		});

		it('Requires integer fiscal sponsor changemaker ID', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '7298203414664558984610516511378791622113',
				name: 'Changemaker 7298203414664558984610516511378791622113',
				keycloakOrganizationId: null,
			});
			const fiscalSponsor = await createChangemaker(db, null, {
				taxId: '8494764604446455156148141002214850975680',
				name: 'Changemaker 8494764604446455156148141002214850975680',
				keycloakOrganizationId: null,
			});
			await request(app)
				.put(
					`/changemakers/${changemaker.id}/fiscalSponsors/${fiscalSponsor.name}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(400);
		});
	});

	describe('DELETE /:changemakerId/fiscalSponsors/:fiscalSponsorChangemakerId', () => {
		it('Successfully deletes and reflects fiscal sponsorship deletion', async () => {
			const fiscalSponsee = await createChangemaker(db, null, {
				taxId: '1176348939800751264285731454220204166679',
				name: 'Sponsee 1176348939800751264285731454220204166679',
				keycloakOrganizationId: 'f1dccc27-7577-49ce-bf1a-be2e5857453e',
			});
			const fiscalSponsorToRemove = await createChangemaker(db, null, {
				taxId: '4381635557716751790531984665685833874838',
				name: 'Sponsor 4381635557716751790531984665685833874838',
				keycloakOrganizationId: 'b40c474a-a800-4b38-9b1d-4fa5334891d4',
			});
			const fiscalSponsorToKeep = await createChangemaker(db, null, {
				taxId: '4175749600938079345538870816774326771318',
				name: 'Sponsor 4175749600938079345538870816774326771318',
				keycloakOrganizationId: 'e87e0629-e0a5-40ed-8149-61853a41469b',
			});
			await request(app)
				.put(
					`/changemakers/${fiscalSponsee.id}/fiscalSponsors/${fiscalSponsorToRemove.id}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(200);
			await request(app)
				.put(
					`/changemakers/${fiscalSponsee.id}/fiscalSponsors/${fiscalSponsorToKeep.id}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(200);
			await request(app)
				.delete(
					`/changemakers/${fiscalSponsee.id}/fiscalSponsors/${fiscalSponsorToRemove.id}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(204);
			const changemakerResult = await request(app)
				.get(`/changemakers/${fiscalSponsee.id}`)
				.set(adminUserAuthHeader)
				.expect(200);
			expect(changemakerResult.body).toStrictEqual({
				...fiscalSponsee,
				createdAt: expectTimestamp(),
				fiscalSponsors: [
					{
						id: fiscalSponsorToKeep.id,
						taxId: fiscalSponsorToKeep.taxId,
						name: fiscalSponsorToKeep.name,
						keycloakOrganizationId: fiscalSponsorToKeep.keycloakOrganizationId,
						createdAt: fiscalSponsorToKeep.createdAt,
					},
				],
			});
		});

		it('Requires integer fiscal sponsee changemaker ID', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '1242568879363886626420956259771401621899',
				name: 'Changemaker 1242568879363886626420956259771401621899',
				keycloakOrganizationId: null,
			});
			const fiscalSponsor = await createChangemaker(db, null, {
				taxId: '9631835019383831266590218120243485803527',
				name: 'Changemaker 9631835019383831266590218120243485803527',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/changemakers/${changemaker.name}/fiscalSponsors/${fiscalSponsor.id}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(400);
		});

		it('Requires integer fiscal sponsor changemaker ID', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '3909708258449105175781605552529587857130',
				name: 'Changemaker 3909708258449105175781605552529587857130',
				keycloakOrganizationId: null,
			});
			const fiscalSponsor = await createChangemaker(db, null, {
				taxId: '0122135026985401334024359249372342493508',
				name: 'Changemaker 0122135026985401334024359249372342493508',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/changemakers/${changemaker.id}/fiscalSponsors/${fiscalSponsor.name}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(400);
		});

		it('Returns 404 on non-existent row', async () => {
			const changemaker = await createChangemaker(db, null, {
				taxId: '0628076601768301607043597902351679068570',
				name: 'Changemaker 0628076601768301607043597902351679068570',
				keycloakOrganizationId: null,
			});
			const fiscalSponsor = await createChangemaker(db, null, {
				taxId: '0450942762614979070967286505967259109014',
				name: 'Changemaker 0450942762614979070967286505967259109014',
				keycloakOrganizationId: null,
			});
			await request(app)
				.delete(
					`/changemakers/${changemaker.id * 5}/fiscalSponsors/${fiscalSponsor.id * 5 * 13}`,
				)
				.type('application/json')
				.set(adminUserAuthHeader)
				.send()
				.expect(404);
		});
	});

	describe('GET /:id with ChangemakerFieldValues', () => {
		it('returns ChangemakerFieldValue when no ProposalFieldValue exists', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Organization Mission',
				shortCode: 'org_mission_cfv_test',
				description: 'The mission of the organization.',
				dataType: BaseFieldDataType.STRING,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const changemaker = await createChangemaker(db, null, {
				taxId: '99-9999991',
				name: 'Test Changemaker CFV',
				keycloakOrganizationId: null,
			});
			// Create a changemaker-sourced source
			const changemakerSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: `${changemaker.name} source`,
			});
			// Create a batch linked to the source
			const batch = await createChangemakerFieldValueBatch(
				db,
				systemUserAuthContext,
				{
					sourceId: changemakerSource.id,
					notes: 'Test batch',
				},
			);
			// Create a ChangemakerFieldValue
			const changemakerFieldValue = await createChangemakerFieldValue(
				db,
				systemUserAuthContext,
				{
					changemakerId: changemaker.id,
					baseFieldShortCode: baseField.shortCode,
					batchId: batch.id,
					value: 'Our mission is to change the world.',
					isValid: true,
					goodAsOf: null,
				},
			);
			await request(app)
				.get(`/changemakers/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					expect(res.body).toMatchObject({
						id: changemaker.id,
						fields: [changemakerFieldValue],
					});
				});
		});

		it('returns changemaker-sourced ChangemakerFieldValue over funder-sourced ProposalFieldValue', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Organization Website',
				shortCode: 'org_website_priority_test',
				description: 'The website of the organization.',
				dataType: BaseFieldDataType.URL,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const changemaker = await createChangemaker(db, null, {
				taxId: '99-9999992',
				name: 'Test Changemaker Priority',
				keycloakOrganizationId: null,
			});

			// Create a funder and opportunity for the ProposalFieldValue
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'funder_priority_test',
				name: 'Funder Priority Test',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const opportunity = await createOpportunity(db, null, {
				title: 'Priority Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			const funderSource = await createSource(db, null, {
				funderShortCode: funder.shortCode,
				label: 'Funder Priority Source',
			});

			// Create ProposalFieldValue from funder source (should be lower priority)
			const proposal = await createProposal(db, systemUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: 'priority-test-proposal',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: changemaker.id,
				proposalId: proposal.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const proposalVersion = await createProposalVersion(
				db,
				systemUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: funderSource.id,
				},
			);
			const applicationFormField = await createApplicationFormField(db, null, {
				label: 'Website',
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				instructions: 'Enter website',
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: proposalVersion.id,
				applicationFormFieldId: applicationFormField.id,
				position: 1,
				value: 'https://funder-provided.com',
				isValid: true,
				goodAsOf: null,
			});

			// Create changemaker-sourced ChangemakerFieldValue (should win)
			const changemakerSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: `${changemaker.name} source`,
			});
			const batch = await createChangemakerFieldValueBatch(
				db,
				systemUserAuthContext,
				{
					sourceId: changemakerSource.id,
					notes: 'Changemaker batch',
				},
			);
			const changemakerFieldValue = await createChangemakerFieldValue(
				db,
				systemUserAuthContext,
				{
					changemakerId: changemaker.id,
					baseFieldShortCode: baseField.shortCode,
					batchId: batch.id,
					value: 'https://changemaker-provided.com',
					isValid: true,
					goodAsOf: null,
				},
			);

			await request(app)
				.get(`/changemakers/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					// Should return the changemaker-sourced value, not funder-sourced
					expect(res.body).toMatchObject({
						id: changemaker.id,
						fields: [changemakerFieldValue],
					});
				});
		});

		it('returns newer ChangemakerFieldValue when both have same source priority', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Organization Phone',
				shortCode: 'org_phone_recency_test',
				description: 'The phone of the organization.',
				dataType: BaseFieldDataType.PHONE_NUMBER,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const changemaker = await createChangemaker(db, null, {
				taxId: '99-9999993',
				name: 'Test Changemaker Recency',
				keycloakOrganizationId: null,
			});

			// Create changemaker-sourced source
			const changemakerSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: `${changemaker.name} source`,
			});

			// Create older ChangemakerFieldValue
			const olderBatch = await createChangemakerFieldValueBatch(
				db,
				systemUserAuthContext,
				{
					sourceId: changemakerSource.id,
					notes: 'Older batch',
				},
			);
			await createChangemakerFieldValue(db, systemUserAuthContext, {
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				batchId: olderBatch.id,
				value: '+15555550001',
				isValid: true,
				goodAsOf: null,
			});

			// Create newer ChangemakerFieldValue (should win)
			const newerBatch = await createChangemakerFieldValueBatch(
				db,
				systemUserAuthContext,
				{
					sourceId: changemakerSource.id,
					notes: 'Newer batch',
				},
			);
			const newerFieldValue = await createChangemakerFieldValue(
				db,
				systemUserAuthContext,
				{
					changemakerId: changemaker.id,
					baseFieldShortCode: baseField.shortCode,
					batchId: newerBatch.id,
					value: '+15555550002',
					isValid: true,
					goodAsOf: null,
				},
			);

			await request(app)
				.get(`/changemakers/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					// Should return the newer value
					expect(res.body).toMatchObject({
						id: changemaker.id,
						fields: [newerFieldValue],
					});
				});
		});

		it('does not return invalid ChangemakerFieldValues', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const baseField = await createOrUpdateBaseField(db, null, {
				label: 'Organization Email',
				shortCode: 'org_email_validity_test',
				description: 'The email of the organization.',
				dataType: BaseFieldDataType.EMAIL,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const changemaker = await createChangemaker(db, null, {
				taxId: '99-9999994',
				name: 'Test Changemaker Validity',
				keycloakOrganizationId: null,
			});

			const changemakerSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: `${changemaker.name} source`,
			});
			const batch = await createChangemakerFieldValueBatch(
				db,
				systemUserAuthContext,
				{
					sourceId: changemakerSource.id,
					notes: 'Test batch',
				},
			);
			// Create an invalid ChangemakerFieldValue
			await createChangemakerFieldValue(db, systemUserAuthContext, {
				changemakerId: changemaker.id,
				baseFieldShortCode: baseField.shortCode,
				batchId: batch.id,
				value: 'not-a-valid-email',
				isValid: false,
				goodAsOf: null,
			});

			await request(app)
				.get(`/changemakers/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					// Should return no fields since the only value is invalid
					expect(res.body).toMatchObject({
						id: changemaker.id,
						fields: [],
					});
				});
		});

		it('returns both ProposalFieldValue and ChangemakerFieldValue for different base fields', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser();
			const baseFieldEmail = await createOrUpdateBaseField(db, null, {
				label: 'Org Email Multi',
				shortCode: 'org_email_multi_test',
				description: 'The email of the organization.',
				dataType: BaseFieldDataType.EMAIL,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const baseFieldPhone = await createOrUpdateBaseField(db, null, {
				label: 'Org Phone Multi',
				shortCode: 'org_phone_multi_test',
				description: 'The phone of the organization.',
				dataType: BaseFieldDataType.PHONE_NUMBER,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const changemaker = await createChangemaker(db, null, {
				taxId: '99-9999995',
				name: 'Test Changemaker Multi Fields',
				keycloakOrganizationId: null,
			});

			// Create ChangemakerFieldValue for email
			const changemakerSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: `${changemaker.name} source`,
			});
			const batch = await createChangemakerFieldValueBatch(
				db,
				systemUserAuthContext,
				{
					sourceId: changemakerSource.id,
					notes: 'Multi test batch',
				},
			);
			await createChangemakerFieldValue(db, systemUserAuthContext, {
				changemakerId: changemaker.id,
				baseFieldShortCode: baseFieldEmail.shortCode,
				batchId: batch.id,
				value: 'multi@test.com',
				isValid: true,
				goodAsOf: null,
			});

			// Create ProposalFieldValue for phone
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'funder_multi_test',
				name: 'Funder Multi Test',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});

			// Grant permission with proposalFieldValue scope so test user can see field values
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [
					PermissionGrantEntityType.PROPOSAL,
					PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const opportunity = await createOpportunity(db, null, {
				title: 'Multi Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			const funderSource = await createSource(db, null, {
				funderShortCode: funder.shortCode,
				label: 'Funder Multi Source',
			});
			const proposal = await createProposal(db, systemUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: 'multi-test-proposal',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: changemaker.id,
				proposalId: proposal.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const proposalVersion = await createProposalVersion(
				db,
				systemUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: funderSource.id,
				},
			);
			const applicationFormField = await createApplicationFormField(db, null, {
				label: 'Phone',
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseFieldPhone.shortCode,
				position: 1,
				instructions: 'Enter phone',
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: proposalVersion.id,
				applicationFormFieldId: applicationFormField.id,
				position: 1,
				value: '+15555559999',
				isValid: true,
				goodAsOf: null,
			});

			await request(app)
				.get(`/changemakers/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					// Should return both field values (one from each type)
					expect(res.body).toMatchObject({
						id: changemaker.id,
						fields: expectArrayContaining([
							expectObjectContaining({
								changemakerId: changemaker.id,
								value: 'multi@test.com',
							}),
							expectObjectContaining({
								proposalVersionId: proposalVersion.id,
								value: '+15555559999',
							}),
						]),
					});
				});
		});

		it('only returns ProposalFieldValues from proposals where user has proposalFieldValue scope', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser();

			const baseFieldEmail = await createOrUpdateBaseField(db, null, {
				label: 'Org Email Perm Test',
				shortCode: 'org_email_perm_test',
				description: 'The email of the organization.',
				dataType: BaseFieldDataType.EMAIL,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const baseFieldPhone = await createOrUpdateBaseField(db, null, {
				label: 'Org Phone Perm Test',
				shortCode: 'org_phone_perm_test',
				description: 'The phone of the organization.',
				dataType: BaseFieldDataType.PHONE_NUMBER,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const changemaker = await createChangemaker(db, null, {
				taxId: '99-9999996',
				name: 'Test Changemaker Permission Filter',
				keycloakOrganizationId: null,
			});

			// Create two funders with different permissions
			const funderWithFieldValueScope = await createOrUpdateFunder(db, null, {
				shortCode: 'funder_with_fv_scope',
				name: 'Funder With Field Value Scope',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const funderWithoutFieldValueScope = await createOrUpdateFunder(
				db,
				null,
				{
					shortCode: 'funder_without_fv_scope',
					name: 'Funder Without Field Value Scope',
					keycloakOrganizationId: null,
					isCollaborative: false,
				},
			);

			// Grant permission WITH proposalFieldValue scope for first funder
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funderWithFieldValueScope.shortCode,
				scope: [
					PermissionGrantEntityType.PROPOSAL,
					PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});

			// Grant permission WITHOUT proposalFieldValue scope for second funder
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funderWithoutFieldValueScope.shortCode,
				scope: [PermissionGrantEntityType.PROPOSAL],
				verbs: [PermissionGrantVerb.VIEW],
			});

			// Create proposal 1 (under funder WITH proposalFieldValue scope)
			const opportunity1 = await createOpportunity(db, null, {
				title: 'Opportunity With FV Scope',
				funderShortCode: funderWithFieldValueScope.shortCode,
			});
			const source1 = await createSource(db, null, {
				funderShortCode: funderWithFieldValueScope.shortCode,
				label: 'Source With FV Scope',
			});
			const proposal1 = await createProposal(db, systemUserAuthContext, {
				opportunityId: opportunity1.id,
				externalId: 'proposal-with-fv-scope',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: changemaker.id,
				proposalId: proposal1.id,
			});
			const applicationForm1 = await createApplicationForm(db, null, {
				opportunityId: opportunity1.id,
				name: null,
			});
			const proposalVersion1 = await createProposalVersion(
				db,
				systemUserAuthContext,
				{
					proposalId: proposal1.id,
					applicationFormId: applicationForm1.id,
					sourceId: source1.id,
				},
			);
			const applicationFormField1 = await createApplicationFormField(db, null, {
				label: 'Email',
				applicationFormId: applicationForm1.id,
				baseFieldShortCode: baseFieldEmail.shortCode,
				position: 1,
				instructions: 'Enter email',
			});
			const visibleFieldValue = await createProposalFieldValue(db, null, {
				proposalVersionId: proposalVersion1.id,
				applicationFormFieldId: applicationFormField1.id,
				position: 1,
				value: 'visible@test.com',
				isValid: true,
				goodAsOf: null,
			});

			// Create proposal 2 (under funder WITHOUT proposalFieldValue scope)
			const opportunity2 = await createOpportunity(db, null, {
				title: 'Opportunity Without FV Scope',
				funderShortCode: funderWithoutFieldValueScope.shortCode,
			});
			const source2 = await createSource(db, null, {
				funderShortCode: funderWithoutFieldValueScope.shortCode,
				label: 'Source Without FV Scope',
			});
			const proposal2 = await createProposal(db, systemUserAuthContext, {
				opportunityId: opportunity2.id,
				externalId: 'proposal-without-fv-scope',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: changemaker.id,
				proposalId: proposal2.id,
			});
			const applicationForm2 = await createApplicationForm(db, null, {
				opportunityId: opportunity2.id,
				name: null,
			});
			const proposalVersion2 = await createProposalVersion(
				db,
				systemUserAuthContext,
				{
					proposalId: proposal2.id,
					applicationFormId: applicationForm2.id,
					sourceId: source2.id,
				},
			);
			const applicationFormField2 = await createApplicationFormField(db, null, {
				label: 'Phone',
				applicationFormId: applicationForm2.id,
				baseFieldShortCode: baseFieldPhone.shortCode,
				position: 1,
				instructions: 'Enter phone',
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: proposalVersion2.id,
				applicationFormFieldId: applicationFormField2.id,
				position: 1,
				value: '+15555550000',
				isValid: true,
				goodAsOf: null,
			});

			await request(app)
				.get(`/changemakers/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					// Should only return the field value from the proposal where user
					// has proposalFieldValue scope, not the one without
					expect(res.body).toMatchObject({
						id: changemaker.id,
						fields: [visibleFieldValue],
					});
				});
		});

		it('decorates ChangemakerFieldValue file fields with downloadUrl', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);

			// Create a file-type base field
			const baseFieldFile = await createOrUpdateBaseField(db, null, {
				label: 'Organization Document',
				shortCode: 'org_document_download_url_test',
				description: 'A document associated with the organization.',
				dataType: BaseFieldDataType.FILE,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const changemaker = await createChangemaker(db, null, {
				taxId: '99-9999998',
				name: 'Test Changemaker File Download',
				keycloakOrganizationId: null,
			});

			// Create a test file
			const testFile = await createTestFile(db, systemUserAuthContext, {
				name: 'test-document.pdf',
				mimeType: 'application/pdf',
				size: 12345,
			});

			// Create changemaker-sourced source and batch
			const changemakerSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: `${changemaker.name} source`,
			});
			const batch = await createChangemakerFieldValueBatch(
				db,
				systemUserAuthContext,
				{
					sourceId: changemakerSource.id,
					notes: 'File download URL test batch',
				},
			);

			// Create a ChangemakerFieldValue with the file ID as the value
			await createChangemakerFieldValue(db, systemUserAuthContext, {
				changemakerId: changemaker.id,
				baseFieldShortCode: baseFieldFile.shortCode,
				batchId: batch.id,
				value: testFile.id.toString(),
				isValid: true,
				goodAsOf: null,
			});

			await request(app)
				.get(`/changemakers/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					expect(res.body).toMatchObject({
						id: changemaker.id,
						fields: [
							expectObjectContaining({
								changemakerId: changemaker.id,
								baseFieldShortCode: baseFieldFile.shortCode,
								value: testFile.id.toString(),
								file: expectObjectContaining({
									id: testFile.id,
									name: 'test-document.pdf',
									downloadUrl: expectString(),
								}),
							}),
						],
					});
				});
		});

		it('decorates ProposalFieldValue file fields with downloadUrl', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser();

			// Create a file-type base field (must be ORGANIZATION category to appear in changemaker fields)
			const baseFieldFile = await createOrUpdateBaseField(db, null, {
				label: 'Organization Attachment',
				shortCode: 'org_attachment_download_url_test',
				description: 'An attachment associated with the organization.',
				dataType: BaseFieldDataType.FILE,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const changemaker = await createChangemaker(db, null, {
				taxId: '99-9999999',
				name: 'Test Changemaker Proposal File Download',
				keycloakOrganizationId: null,
			});

			// Create a test file
			const testFile = await createTestFile(db, systemUserAuthContext, {
				name: 'proposal-attachment.pdf',
				mimeType: 'application/pdf',
				size: 54321,
			});

			// Create funder, opportunity, and proposal for ProposalFieldValue
			const funder = await createOrUpdateFunder(db, null, {
				shortCode: 'funder_proposal_file_test',
				name: 'Funder Proposal File Test',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const opportunity = await createOpportunity(db, null, {
				title: 'Proposal File Test Opportunity',
				funderShortCode: funder.shortCode,
			});
			const funderSource = await createSource(db, null, {
				funderShortCode: funder.shortCode,
				label: 'Funder Proposal File Source',
			});

			const proposal = await createProposal(db, systemUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: 'proposal-file-test',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: changemaker.id,
				proposalId: proposal.id,
			});

			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const proposalVersion = await createProposalVersion(
				db,
				systemUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: funderSource.id,
				},
			);
			const applicationFormField = await createApplicationFormField(db, null, {
				label: 'Attachment',
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseFieldFile.shortCode,
				position: 1,
				instructions: 'Upload attachment',
			});

			// Create a ProposalFieldValue with the file ID as the value
			await createProposalFieldValue(db, null, {
				proposalVersionId: proposalVersion.id,
				applicationFormFieldId: applicationFormField.id,
				position: 1,
				value: testFile.id.toString(),
				isValid: true,
				goodAsOf: null,
			});

			// Grant permission to view proposals and their field values
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [
					PermissionGrantEntityType.PROPOSAL,
					PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});

			await request(app)
				.get(`/changemakers/${changemaker.id}`)
				.set(authHeader)
				.expect(200)
				.expect((res) => {
					expect(res.body).toMatchObject({
						id: changemaker.id,
						fields: [
							expectObjectContaining({
								proposalVersionId: proposalVersion.id,
								value: testFile.id.toString(),
								file: expectObjectContaining({
									id: testFile.id,
									name: 'proposal-attachment.pdf',
									downloadUrl: expectString(),
								}),
							}),
						],
					});
				});
		});
	});
});
