import request from 'supertest';
import { app } from '../app';
import {
	createApplicationForm,
	createApplicationFormField,
	createOrUpdateBaseField,
	createChangemakerProposal,
	createEphemeralUserGroupAssociation,
	createProposalFieldValue,
	createProposalVersion,
	getDatabase,
	loadPermissionGrantBundle,
	loadSystemSource,
	loadTableMetrics,
	loadSystemFunder,
	loadSystemUser,
	createPermissionGrant,
} from '../database';
import {
	createTestBaseField,
	createTestChangemaker,
	createTestFunder,
	createTestOpportunity,
	createTestProposal,
	createTestUser,
} from '../test/factories';
import {
	getAuthContext,
	loadTestUser,
	NO_LIMIT,
	NO_OFFSET,
} from '../test/utils';
import {
	expectArray,
	expectArrayContaining,
	expectObjectContaining,
	expectString,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithoutSub as authHeaderWithNoSubj,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import {
	BaseFieldSensitivityClassification,
	keycloakIdToString,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
	stringToKeycloakId,
} from '../types';
import type { Proposal } from '../types';

describe('/proposals', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/proposals').expect(401);
		});

		it('returns an empty Bundle when no data is present', async () => {
			const response = await request(app)
				.get('/proposals')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 0,
				entries: [],
			});
		});

		it('returns proposals the user has permission to view', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const anotherFunder = await loadSystemFunder(db, null);
			const visibleFunder = await createTestFunder(db, testUserAuthContext, {
				name: 'Visible Funder',
				shortCode: 'visibleFunder',
			});
			const visibleChangemaker = await createTestChangemaker(
				db,
				testUserAuthContext,
				{
					name: 'Visible Changemaker',
				},
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [
					PermissionGrantEntityType.FUNDER,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
				changemakerId: visibleChangemaker.id,
				scope: [
					PermissionGrantEntityType.CHANGEMAKER,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const visibleOpportunity = await createTestOpportunity(
				db,
				testUserAuthContext,
				{
					funderShortCode: visibleFunder.shortCode,
				},
			);
			const anotherOpportunity = await createTestOpportunity(
				db,
				testUserAuthContext,
				{
					funderShortCode: anotherFunder.shortCode,
				},
			);
			const funderVisibleProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: visibleOpportunity.id,
				},
			);
			const changemakerVisibleProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: anotherOpportunity.id,
				},
			);
			await createChangemakerProposal(db, null, {
				changemakerId: visibleChangemaker.id,
				proposalId: changemakerVisibleProposal.id,
			});
			await createTestProposal(db, testUserAuthContext, {
				opportunityId: anotherOpportunity.id,
			});
			const response = await request(app)
				.get('/proposals')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						...changemakerVisibleProposal,
						changemakers: [
							expect.objectContaining({
								id: visibleChangemaker.id,
								name: 'Visible Changemaker',
							}),
						],
					},
					funderVisibleProposal,
				],
			});
		});

		it('returns a subset of proposals present in the database when a changemaker filter is provided', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const proposal = await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			const changemaker = await createTestChangemaker(db, testUserAuthContext, {
				name: 'Canadian Company',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: changemaker.id,
				proposalId: proposal.id,
			});
			const response = await request(app)
				.get(`/proposals?changemaker=${changemaker.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toStrictEqual({
				total: 1,
				entries: [
					{
						...proposal,
						opportunity,
						versions: [],
						changemakers: [
							{
								id: changemaker.id,
								taxId: changemaker.taxId,
								name: changemaker.name,
								keycloakOrganizationId: null,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
							},
						],
					},
				],
			});
		});

		it('returns a subset of proposals present in the database when a funder filter is provided', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const testFunder = await createTestFunder(db, testUserAuthContext);

			const systemOpportunity = await createTestOpportunity(
				db,
				testUserAuthContext,
			);
			const testFunderOpportunity = await createTestOpportunity(
				db,
				testUserAuthContext,
				{
					funderShortCode: testFunder.shortCode,
				},
			);

			await createTestProposal(db, testUserAuthContext, {
				opportunityId: systemOpportunity.id,
			});
			const testFunderProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: testFunderOpportunity.id,
				},
			);
			const response = await request(app)
				.get(`/proposals?funder=${testFunder.shortCode}`)
				.set(authHeaderWithAdminRole)
				.expect(200);

			expect(response.body).toStrictEqual({
				total: 1,
				entries: [
					{
						...testFunderProposal,
						opportunity: testFunderOpportunity,
						versions: [],
						changemakers: [],
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

		it('returns a 400 error if an invalid funder filter is provided', async () => {
			const response = await request(app)
				.get(`/proposals?funder=\u{1F600}`)
				.set(authHeader)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				message: expectString(),
			});
		});

		it('returns a 400 error if an invalid createdBy filter is provided', async () => {
			const response = await request(app)
				.get(`/proposals?createdBy=foo`)
				.set(authHeader)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				message: expectString(),
			});
		});

		it('returns a subset of proposals present in the database when search is provided', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const systemSource = await loadSystemSource(db, null);
			const summaryField = await createTestBaseField(db, null);
			const matchingProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: opportunity.id,
				},
			);
			await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: 1,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: 2,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: summaryField.shortCode,
				position: 1,
				label: 'Short summary',
				instructions: 'Please enter a short summary of the proposal.',
				inputType: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a summary',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a pair of pants',
				isValid: true,
				goodAsOf: null,
			});
			const response = await request(app)
				.get('/proposals?_content=summary')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						...matchingProposal,
						opportunity,
						versions: [
							{
								id: 1,
								proposalId: 1,
								sourceId: systemSource.id,
								source: systemSource,
								version: 1,
								applicationFormId: 1,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
								fieldValues: [
									{
										id: 1,
										applicationFormFieldId: 1,
										proposalVersionId: 1,
										position: 1,
										value: 'This is a summary',
										file: null,
										isValid: true,
										goodAsOf: null,
										createdAt: expectTimestamp(),
										applicationFormField: {
											id: 1,
											applicationFormId: 1,
											baseFieldShortCode: summaryField.shortCode,
											instructions:
												'Please enter a short summary of the proposal.',
											baseField: summaryField,
											label: 'Short summary',
											position: 1,
											inputType: null,
											createdAt: expectTimestamp(),
										},
									},
								],
							},
						],
						changemakers: [],
					},
				],
			});
		});

		it('does not return proposals where there is a search match against a forbidden base field', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			const systemSource = await loadSystemSource(db, null);
			const baseField = await createTestBaseField(db, null, {
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const proposal = await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const proposalVersion = await createProposalVersion(
				db,
				testUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
				},
			);
			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseField.shortCode,
				position: 1,
				label: 'Not Allowed',
				instructions: 'This field should not be used in proposal versions',
				inputType: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: proposalVersion.id,
				applicationFormFieldId: applicationFormField.id,
				position: 1,
				value: 'Totally Forbidden',
				isValid: true,
				goodAsOf: null,
			});
			await createOrUpdateBaseField(db, null, {
				...baseField,
				sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
			});

			const response = await request(app)
				.get('/proposals?_content=Forbidden')
				.set(authHeaderWithAdminRole)
				.expect(200);

			expect(response.body).toEqual({
				total: 0,
				entries: [],
			});
		});

		it('returns all proposals present in the database regardless of createdBy value when loading as an administrator', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createTestUser(db, null);
			const anotherUserAuthContext = getAuthContext(anotherUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const testUserProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: opportunity.id,
				},
			);
			const anotherUserProposal = await createTestProposal(
				db,
				anotherUserAuthContext,
				{
					opportunityId: opportunity.id,
				},
			);
			const response = await request(app)
				.get('/proposals')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						...anotherUserProposal,
						opportunity,
						versions: [],
						changemakers: [],
					},
					{
						...testUserProposal,
						opportunity,
						versions: [],
						changemakers: [],
					},
				],
			});
		});

		it('returns a correct subset of proposals when createdBy is provided as an administrator', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createTestUser(db, null);
			const anotherUserAuthContext = getAuthContext(anotherUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const testUserProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: opportunity.id,
				},
			);
			await createTestProposal(db, anotherUserAuthContext, {
				opportunityId: opportunity.id,
			});
			const response = await request(app)
				.get(
					`/proposals?createdBy=${keycloakIdToString(testUser.keycloakUserId)}`,
				)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						...testUserProposal,
						opportunity,
						versions: [],
						changemakers: [],
					},
				],
			});
		});

		it("returns just the administrator's proposals when createdBy is set to `me` as an administrator", async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createTestUser(db, null);
			const anotherUserAuthContext = getAuthContext(anotherUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const testUserProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: opportunity.id,
				},
			);
			await createTestProposal(db, anotherUserAuthContext, {
				opportunityId: opportunity.id,
			});
			const response = await request(app)
				.get(`/proposals?createdBy=me`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						...testUserProposal,
						opportunity,
						versions: [],
						changemakers: [],
					},
				],
			});
		});

		it('returns a subset of proposals present in the database when search is provided - tscfg simple', async () => {
			const db = getDatabase();
			// This should pass even if the default text search config is 'simple'.
			// See https://github.com/PhilanthropyDataCommons/service/issues/336
			await db.query("set default_text_search_config = 'simple';");
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			const systemSource = await loadSystemSource(db, null);
			const summaryField = await createTestBaseField(db, null);
			const matchingProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: opportunity.id,
				},
			);
			await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: 1,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: 2,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: summaryField.shortCode,
				position: 1,
				label: 'Concise summary',
				instructions: 'Please enter a concise summary of the proposal.',
				inputType: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a summary',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a pair of pants',
				isValid: true,
				goodAsOf: null,
			});
			const response = await request(app)
				.get('/proposals?_content=summary')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 1,
				entries: [
					{
						...matchingProposal,
						opportunity,
						versions: [
							{
								id: 1,
								proposalId: 1,
								sourceId: systemSource.id,
								source: systemSource,
								version: 1,
								applicationFormId: 1,
								createdAt: expectTimestamp(),
								createdBy: testUser.keycloakUserId,
								fieldValues: [
									{
										id: 1,
										applicationFormFieldId: 1,
										proposalVersionId: 1,
										position: 1,
										value: 'This is a summary',
										file: null,
										isValid: true,
										goodAsOf: null,
										createdAt: expectTimestamp(),
										applicationFormField: {
											id: 1,
											applicationFormId: 1,
											baseFieldShortCode: summaryField.shortCode,
											baseField: summaryField,
											label: 'Concise summary',
											instructions:
												'Please enter a concise summary of the proposal.',
											position: 1,
											inputType: null,
											createdAt: expectTimestamp(),
										},
									},
								],
							},
						],
						changemakers: [],
					},
				],
			});
		});

		it('returns according to pagination parameters', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			const proposals = await Array.from(Array(20)).reduce<Promise<Proposal[]>>(
				async (acc) => {
					const list = await acc;
					list.push(
						await createTestProposal(db, testUserAuthContext, {
							opportunityId: opportunity.id,
						}),
					);
					return list;
				},
				Promise.resolve([]),
			);
			const response = await request(app)
				.get('/proposals')
				.query({
					_page: 2,
					_count: 5,
				})
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 20,
				entries: [
					{
						...proposals[14],
						opportunity,
						versions: [],
						changemakers: [],
					},
					{
						...proposals[13],
						opportunity,
						versions: [],
						changemakers: [],
					},
					{
						...proposals[12],
						opportunity,
						versions: [],
						changemakers: [],
					},
					{
						...proposals[11],
						opportunity,
						versions: [],
						changemakers: [],
					},
					{
						...proposals[10],
						opportunity,
						versions: [],
						changemakers: [],
					},
				],
			});
		});
	});

	describe('GET /:id', () => {
		it('requires authentication', async () => {
			await request(app).get('/proposals/9001').expect(401);
		});

		it('returns 404 when given id is not present', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const response = await request(app)
				.get('/proposals/9001')
				.set(authHeader)
				.expect(404);
			expect(response.body).toEqual({
				name: 'NotFoundError',
				message: expectString(),
				details: [
					{
						name: 'NotFoundError',
						details: {
							entityType: 'Proposal',
							lookupValues: {
								authContextIsAdministrator: false,
								authContextKeycloakUserId: testUser.keycloakUserId,
								proposalId: 9001,
							},
						},
					},
				],
			});
		});

		it('returns 404 when the current user does not have permission to view the provided id', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const anotherUser = await createTestUser(db, null);
			const anotherUserAuthContext = getAuthContext(anotherUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			const proposal = await createTestProposal(db, anotherUserAuthContext, {
				opportunityId: opportunity.id,
			});

			// Also create a userGroup permission grant with an EXPIRED association
			// to verify that expired associations don't grant access
			const expiredOrgId = 'dddddddd-1111-2222-3333-444444444444';
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER_GROUP,
				granteeKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				contextEntityType: PermissionGrantEntityType.PROPOSAL,
				proposalId: proposal.id,
				scope: [PermissionGrantEntityType.PROPOSAL],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await createEphemeralUserGroupAssociation(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				userGroupKeycloakOrganizationId: stringToKeycloakId(expiredOrgId),
				notAfter: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
			});

			const response = await request(app)
				.get(`/proposals/${proposal.id}`)
				.set(authHeader)
				.expect(404);
			expect(response.body).toEqual({
				name: 'NotFoundError',
				message: expectString(),
				details: [
					{
						name: 'NotFoundError',
						details: {
							entityType: 'Proposal',
							lookupValues: {
								authContextIsAdministrator: false,
								authContextKeycloakUserId: testUser.keycloakUserId,
								proposalId: proposal.id,
							},
						},
					},
				],
			});
		});

		it('returns 400 when given id is a string', async () => {
			const response = await request(app)
				.get('/proposals/foobar')
				.set(authHeader)
				.expect(400);
			expect(response.body).toEqual({
				name: 'InputValidationError',
				message: expectString(),
				details: [expect.any(Object)],
			});
		});

		it('returns the one proposal asked for', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			const requestedProposal = await createTestProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: opportunity.id,
				},
			);

			const response = await request(app)
				.get(`/proposals/${requestedProposal.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				...requestedProposal,
				opportunity,
				versions: [],
				changemakers: [],
			});
		});

		it('returns one proposal with deep fields', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			const titleField = await createTestBaseField(db, null);
			const summaryField = await createTestBaseField(db, null);
			await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: titleField.shortCode,
				position: 1,
				label: 'Short summary or title',
				instructions: 'Please enter a short summary or title of the proposal.',
				inputType: null,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: summaryField.shortCode,
				position: 2,
				label: 'Long summary or abstract',
				instructions:
					'Please enter a long summary or abstract of the proposal.',
				inputType: null,
			});
			const systemSource = await loadSystemSource(db, null);
			const proposal = await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: proposal.id,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: proposal.id,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 1 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 2,
				position: 2,
				value: 'Abstract for version 1 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 2 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 2,
				position: 2,
				value: 'Abstract for version 2 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			const response = await request(app)
				.get(`/proposals/${proposal.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				...proposal,
				opportunity,
				versions: [
					{
						id: 2,
						proposalId: proposal.id,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 2,
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 3,
								proposalVersionId: 2,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 2 from 2525-01-04',
								file: null,
								isValid: true,
								goodAsOf: null,
								createdAt: expectTimestamp(),
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldShortCode: titleField.shortCode,
									baseField: titleField,
									position: 1,
									label: 'Short summary or title',
									instructions:
										'Please enter a short summary or title of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
							{
								id: 4,
								proposalVersionId: 2,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 2 from 2525-01-04',
								file: null,
								isValid: true,
								goodAsOf: null,
								createdAt: expectTimestamp(),
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldShortCode: summaryField.shortCode,
									baseField: summaryField,
									position: 2,
									label: 'Long summary or abstract',
									instructions:
										'Please enter a long summary or abstract of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
						],
					},
					{
						id: 1,
						proposalId: proposal.id,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 1,
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 1,
								proposalVersionId: 1,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 1 from 2525-01-04',
								file: null,
								createdAt: expectTimestamp(),
								isValid: true,
								goodAsOf: null,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldShortCode: titleField.shortCode,
									baseField: titleField,
									position: 1,
									label: 'Short summary or title',
									instructions:
										'Please enter a short summary or title of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
							{
								id: 2,
								proposalVersionId: 1,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 1 from 2525-01-04',
								file: null,
								isValid: true,
								goodAsOf: null,
								createdAt: expectTimestamp(),
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldShortCode: summaryField.shortCode,
									baseField: summaryField,
									position: 2,
									label: 'Long summary or abstract',
									instructions:
										'Please enter a long summary or abstract of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
						],
					},
				],
				changemakers: [],
			});
		});

		it('returns the proposal if an administrator requests a proposal they do not own', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const titleField = await createTestBaseField(db, null);
			const summaryField = await createTestBaseField(db, null);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: titleField.shortCode,
				position: 1,
				label: 'Short summary or title',
				instructions: 'Please enter a short summary or title of the proposal.',
				inputType: null,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: summaryField.shortCode,
				position: 2,
				label: 'Long summary or abstract',
				instructions:
					'Please enter a full summary or abstract of the proposal.',
				inputType: null,
			});
			const proposal = await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: proposal.id,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: proposal.id,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 1 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 2,
				position: 2,
				value: 'Abstract for version 1 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 2 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 2,
				position: 2,
				value: 'Abstract for version 2 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			const response = await request(app)
				.get(`/proposals/${proposal.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				...proposal,
				opportunity,
				versions: [
					{
						id: 2,
						proposalId: proposal.id,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 2,
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 3,
								proposalVersionId: 2,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 2 from 2525-01-04',
								file: null,
								isValid: true,
								goodAsOf: null,
								createdAt: expectTimestamp(),
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldShortCode: titleField.shortCode,
									baseField: titleField,
									position: 1,
									label: 'Short summary or title',
									instructions:
										'Please enter a short summary or title of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
							{
								id: 4,
								proposalVersionId: 2,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 2 from 2525-01-04',
								file: null,
								isValid: true,
								goodAsOf: null,
								createdAt: expectTimestamp(),
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldShortCode: summaryField.shortCode,
									baseField: summaryField,
									position: 2,
									label: 'Long summary or abstract',
									instructions:
										'Please enter a full summary or abstract of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
						],
					},
					{
						id: 1,
						proposalId: proposal.id,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 1,
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 1,
								proposalVersionId: 1,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 1 from 2525-01-04',
								file: null,
								createdAt: expectTimestamp(),
								isValid: true,
								goodAsOf: null,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldShortCode: titleField.shortCode,
									baseField: titleField,
									position: 1,
									label: 'Short summary or title',
									instructions:
										'Please enter a short summary or title of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
							{
								id: 2,
								proposalVersionId: 1,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 1 from 2525-01-04',
								file: null,
								isValid: true,
								goodAsOf: null,
								createdAt: expectTimestamp(),
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldShortCode: summaryField.shortCode,
									baseField: summaryField,
									position: 2,
									label: 'Long summary or abstract',
									instructions:
										'Please enter a full summary or abstract of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
						],
					},
				],
				changemakers: [],
			});
		});

		it('returns empty fieldValues array when user has proposal scope but not proposalFieldValue scope', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const testFunder = await createTestFunder(db, testUserAuthContext, {
				name: 'Test Funder',
				shortCode: 'testFunder',
			});
			const systemSource = await loadSystemSource(db, null);
			const summaryField = await createTestBaseField(db, null);

			// Grant only proposal scope (not proposalFieldValue)
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: testFunder.shortCode,
				scope: [PermissionGrantEntityType.PROPOSAL],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const opportunity = await createTestOpportunity(db, testUserAuthContext, {
				funderShortCode: testFunder.shortCode,
			});
			const applicationForm = await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: applicationForm.id,
				baseFieldShortCode: summaryField.shortCode,
				position: 1,
				label: 'Summary',
				instructions: 'Enter a summary',
				inputType: null,
			});
			const proposal = await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			const proposalVersion = await createProposalVersion(
				db,
				testUserAuthContext,
				{
					proposalId: proposal.id,
					applicationFormId: applicationForm.id,
					sourceId: systemSource.id,
				},
			);
			await createProposalFieldValue(db, null, {
				proposalVersionId: proposalVersion.id,
				applicationFormFieldId: applicationFormField.id,
				position: 1,
				value: 'This value should be hidden',
				isValid: true,
				goodAsOf: null,
			});

			const response = await request(app)
				.get(`/proposals/${proposal.id}`)
				.set(authHeader)
				.expect(200);

			expect(response.body).toMatchObject({
				id: proposal.id,
				versions: [
					{
						id: proposalVersion.id,
						fieldValues: [],
					},
				],
			});
		});

		it('does not return proposal field values associated with forbidden base fields', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemSource = await loadSystemSource(db, null);
			const titleField = await createTestBaseField(db, null);
			const baseField = await createTestBaseField(db, null, {
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			await createApplicationForm(db, null, {
				opportunityId: opportunity.id,
				name: null,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: titleField.shortCode,
				position: 1,
				label: 'Short summary or title',
				instructions: 'Please enter a short summary or title of the proposal.',
				inputType: null,
			});
			const applicationFormField = await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldShortCode: baseField.shortCode,
				position: 2,
				label: 'forbidden field',
				instructions: 'This field should not be used in proposal versions',
				inputType: null,
			});
			const proposal = await createTestProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
			});
			await createProposalVersion(db, testUserAuthContext, {
				proposalId: proposal.id,
				applicationFormId: 1,
				sourceId: systemSource.id,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 1 from 2525-01-04',
				isValid: true,
				goodAsOf: null,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: applicationFormField.id,
				position: 1,
				value: 'Should not be returned',
				isValid: true,
				goodAsOf: null,
			});
			await createOrUpdateBaseField(db, null, {
				...baseField,
				sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
			});

			const response = await request(app)
				.get(`/proposals/${proposal.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				...proposal,
				opportunity,
				versions: [
					{
						id: 1,
						proposalId: proposal.id,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 1,
						createdAt: expectTimestamp(),
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 1,
								proposalVersionId: 1,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 1 from 2525-01-04',
								file: null,
								createdAt: expectTimestamp(),
								isValid: true,
								goodAsOf: null,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldShortCode: titleField.shortCode,
									baseField: titleField,
									position: 1,
									label: 'Short summary or title',
									instructions:
										'Please enter a short summary or title of the proposal.',
									inputType: null,
									createdAt: expectTimestamp(),
								},
							},
						],
					},
				],
				changemakers: [],
			});
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/proposals').expect(401);
		});

		it('requires a user', async () => {
			await request(app)
				.post('/proposals')
				.set(authHeaderWithNoSubj)
				.expect(401);
		});

		it('creates exactly one proposal when the user is an administrator', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			const before = await loadTableMetrics(db, 'proposals');
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					externalId: 'proposal123',
					opportunityId: opportunity.id,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'proposals');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				externalId: 'proposal123',
				opportunityId: opportunity.id,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(1);
		});

		it('grants the creator a manage permission on the new proposal', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					externalId: 'self-grant-proposal',
					opportunityId: opportunity.id,
				})
				.expect(201);
			const grants = await loadPermissionGrantBundle(
				db,
				getAuthContext(systemUser, true),
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				NO_LIMIT,
				NO_OFFSET,
			);
			expect(grants.entries).toEqual(
				expectArrayContaining([
					expectObjectContaining({
						granteeType: 'user',
						granteeUserKeycloakUserId: testUser.keycloakUserId,
						contextEntityType: 'proposal',
						scope: ['any'],
						verbs: ['manage'],
					}),
				]),
			);
		});

		it('creates exactly one proposal when the user has write permissions on the opportunity funder', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.FUNDER],
				verbs: [PermissionGrantVerb.EDIT],
			});
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			const before = await loadTableMetrics(db, 'proposals');
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					externalId: 'proposal123',
					opportunityId: opportunity.id,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'proposals');
			expect(result.body).toMatchObject({
				id: 1,
				externalId: 'proposal123',
				opportunityId: opportunity.id,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 404 not found when the user cannot view the associated opportunity', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			const before = await loadTableMetrics(db, 'proposals');
			await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
					opportunityId: opportunity.id,
				})
				.expect(404);
			const after = await loadTableMetrics(db, 'proposals');
			expect(after.count).toEqual(before.count);
		});

		it('returns 403 forbidden when the user can view the associated opportunity but lacks create permission', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: opportunity.id,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const before = await loadTableMetrics(db, 'proposals');
			await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
					opportunityId: opportunity.id,
				})
				.expect(403);
			const after = await loadTableMetrics(db, 'proposals');
			expect(after.count).toEqual(before.count);
		});

		it('creates exactly one proposal when the user has create_proposal and view permissions on the opportunity', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser, true);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const opportunity = await createTestOpportunity(db, testUserAuthContext);

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: opportunity.id,
				scope: [PermissionGrantEntityType.PROPOSAL],
				verbs: [PermissionGrantVerb.CREATE],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
				opportunityId: opportunity.id,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const before = await loadTableMetrics(db, 'proposals');
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
					opportunityId: opportunity.id,
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'proposals');
			expect(result.body).toMatchObject({
				id: 1,
				externalId: 'proposal123',
				opportunityId: opportunity.id,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 400 bad request when no external ID is sent', async () => {
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					opportunityId: 1,
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no opportunity ID is sent', async () => {
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
				})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 not found when a non-existent opportunity id is provided', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
					opportunityId: 1,
				})
				.expect(404);
			expect(result.body).toEqual({
				name: 'NotFoundError',
				message: expectString(),
				details: [
					{
						name: 'NotFoundError',
						details: {
							entityType: 'Opportunity',
							lookupValues: {
								authContextIsAdministrator: false,
								authContextKeycloakUserId: testUser.keycloakUserId,
								opportunityId: 1,
							},
						},
					},
				],
			});
		});
	});
});
