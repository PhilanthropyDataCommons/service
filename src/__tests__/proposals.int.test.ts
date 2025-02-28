import request from 'supertest';
import { app } from '../app';
import {
	createApplicationForm,
	createApplicationFormField,
	createBaseField,
	createOpportunity,
	createChangemaker,
	createChangemakerProposal,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	createOrUpdateUser,
	db,
	loadSystemSource,
	loadTableMetrics,
	loadSystemFunder,
	loadSystemUser,
	createOrUpdateUserFunderPermission,
	createOrUpdateFunder,
	createOrUpdateUserChangemakerPermission,
} from '../database';
import { expectTimestamp, loadTestUser } from '../test/utils';
import {
	mockJwt as authHeader,
	mockJwtWithoutSub as authHeaderWithNoSubj,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import {
	BaseFieldDataType,
	BaseFieldScope,
	keycloakIdToString,
	Permission,
} from '../types';

const createTestBaseFields = async () => {
	await createBaseField(db, null, {
		label: 'Summary',
		description: 'A summary of the proposal',
		shortCode: 'summary',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});
	await createBaseField(db, null, {
		label: 'Title',
		description: 'The title of the proposal',
		shortCode: 'title',
		dataType: BaseFieldDataType.STRING,
		scope: BaseFieldScope.PROPOSAL,
	});
};

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
			const anotherFunder = await loadSystemFunder(db, null);
			const visibleFunder = await createOrUpdateFunder(db, null, {
				name: 'Visible Funder',
				shortCode: 'visibleFunder',
				keycloakOrganizationId: null,
			});
			const visibleChangemaker = await createChangemaker(db, null, {
				name: 'Visible Changemaker',
				taxId: '123-123-123',
				keycloakOrganizationId: null,
			});
			const systemUser = await loadSystemUser(db, null);
			const testUser = await loadTestUser();
			await createOrUpdateUserFunderPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				funderShortCode: visibleFunder.shortCode,
				permission: Permission.VIEW,
				createdBy: systemUser.keycloakUserId,
			});
			await createOrUpdateUserChangemakerPermission(db, null, {
				userKeycloakUserId: testUser.keycloakUserId,
				changemakerId: visibleChangemaker.id,
				permission: Permission.VIEW,
				createdBy: systemUser.keycloakUserId,
			});
			const visibleOpportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: visibleFunder.shortCode,
			});
			const anotherOpportunity = await createOpportunity(db, null, {
				title: 'another',
				funderShortCode: anotherFunder.shortCode,
			});
			await createTestBaseFields();
			const funderVisibleProposal = await createProposal(db, null, {
				externalId: 'proposal-1',
				opportunityId: visibleOpportunity.id,
				createdBy: testUser.keycloakUserId,
			});
			const changemakerVisibleProposal = await createProposal(db, null, {
				externalId: 'proposal-2',
				opportunityId: anotherOpportunity.id,
				createdBy: testUser.keycloakUserId,
			});
			await createChangemakerProposal(db, null, {
				changemakerId: visibleChangemaker.id,
				proposalId: changemakerVisibleProposal.id,
			});
			await createProposal(db, null, {
				externalId: 'proposal-3',
				opportunityId: anotherOpportunity.id,
				createdBy: testUser.keycloakUserId,
			});
			const response = await request(app)
				.get('/proposals')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				total: 3,
				entries: [changemakerVisibleProposal, funderVisibleProposal],
			});
		});

		it('returns a subset of proposals present in the database when a changemaker filter is provided', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});

			const testUser = await loadTestUser();
			await createTestBaseFields();
			const proposal = await createProposal(db, null, {
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				externalId: 'proposal-2',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			const changemaker = await createChangemaker(db, null, {
				taxId: '123-123-123',
				name: 'Canadian Company',
				keycloakOrganizationId: null,
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
				total: 2,
				entries: [
					{
						id: 1,
						externalId: 'proposal-1',
						opportunityId: 1,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						versions: [],
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

		it('returns a 400 error if an invalid createdBy filter is provided', async () => {
			const response = await request(app)
				.get(`/proposals?createdBy=foo`)
				.set(authHeader)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				message: expect.any(String) as string,
			});
		});

		it('returns a subset of proposals present in the database when search is provided', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});

			const testUser = await loadTestUser();
			const systemSource = await loadSystemSource(db, null);
			await createTestBaseFields();
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
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createProposalVersion(db, null, {
				proposalId: 1,
				applicationFormId: 1,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
			});
			await createProposalVersion(db, null, {
				proposalId: 2,
				applicationFormId: 1,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldId: 1,
				position: 1,
				label: 'Short summary',
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a summary',
				isValid: true,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a pair of pants',
				isValid: true,
			});
			const response = await request(app)
				.get('/proposals?_content=summary')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						externalId: 'proposal-1',
						opportunityId: 1,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						versions: [
							{
								id: 1,
								proposalId: 1,
								sourceId: systemSource.id,
								source: systemSource,
								version: 1,
								applicationFormId: 1,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
								fieldValues: [
									{
										id: 1,
										applicationFormFieldId: 1,
										proposalVersionId: 1,
										position: 1,
										value: 'This is a summary',
										isValid: true,
										createdAt: expectTimestamp,
										applicationFormField: {
											id: 1,
											applicationFormId: 1,
											baseFieldId: 1,
											baseField: {
												createdAt: expectTimestamp,
												dataType: 'string',
												description: 'A summary of the proposal',
												id: 1,
												label: 'Summary',
												scope: 'proposal',
												shortCode: 'summary',
												localizations: {},
											},
											label: 'Short summary',
											position: 1,
											createdAt: expectTimestamp,
										},
									},
								],
							},
						],
					},
				],
			});
		});

		it('returns all proposals present in the database regardless of createdBy value when loading as an administrator', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});

			const testUser = await loadTestUser();
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			await createTestBaseFields();
			await createProposal(db, null, {
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				externalId: 'proposal-2',
				opportunityId: 1,
				createdBy: anotherUser.keycloakUserId,
			});
			const response = await request(app)
				.get('/proposals')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 2,
						externalId: 'proposal-2',
						opportunityId: 1,
						createdAt: expectTimestamp,
						createdBy: anotherUser.keycloakUserId,
						versions: [],
					},
					{
						id: 1,
						externalId: 'proposal-1',
						opportunityId: 1,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						versions: [],
					},
				],
			});
		});

		it('returns a correct subset of proposals when createdBy is provided as an administrator', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});

			const testUser = await loadTestUser();
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			await createTestBaseFields();
			await createProposal(db, null, {
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				externalId: 'proposal-2',
				opportunityId: 1,
				createdBy: anotherUser.keycloakUserId,
			});
			const response = await request(app)
				.get(
					`/proposals?createdBy=${keycloakIdToString(testUser.keycloakUserId)}`,
				)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						externalId: 'proposal-1',
						opportunityId: 1,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						versions: [],
					},
				],
			});
		});

		it("returns just the administrator's proposals when createdBy is set to `me` as an administrator", async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});

			const testUser = await loadTestUser();
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			await createTestBaseFields();
			await createProposal(db, null, {
				externalId: 'proposal-1',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				externalId: 'proposal-2',
				opportunityId: 1,
				createdBy: anotherUser.keycloakUserId,
			});
			const response = await request(app)
				.get(`/proposals?createdBy=me`)
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						externalId: 'proposal-1',
						opportunityId: 1,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						versions: [],
					},
				],
			});
		});

		it('returns a subset of proposals present in the database when search is provided - tscfg simple', async () => {
			// This should pass even if the default text search config is 'simple'.
			// See https://github.com/PhilanthropyDataCommons/service/issues/336
			await db.query("set default_text_search_config = 'simple';");
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: 'Grand opportunity',
				funderShortCode: systemFunder.shortCode,
			});
			const testUser = await loadTestUser();
			const systemSource = await loadSystemSource(db, null);
			await createTestBaseFields();
			await createProposal(db, null, {
				externalId: 'proposal-4999',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				externalId: 'proposal-5003',
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createProposalVersion(db, null, {
				proposalId: 1,
				applicationFormId: 1,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
			});
			await createProposalVersion(db, null, {
				proposalId: 2,
				applicationFormId: 1,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldId: 1,
				position: 1,
				label: 'Concise summary',
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a summary',
				isValid: true,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'This is a pair of pants',
				isValid: true,
			});
			const response = await request(app)
				.get('/proposals?_content=summary')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				total: 2,
				entries: [
					{
						id: 1,
						externalId: 'proposal-4999',
						opportunityId: 1,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						versions: [
							{
								id: 1,
								proposalId: 1,
								sourceId: systemSource.id,
								source: systemSource,
								version: 1,
								applicationFormId: 1,
								createdAt: expectTimestamp,
								createdBy: testUser.keycloakUserId,
								fieldValues: [
									{
										id: 1,
										applicationFormFieldId: 1,
										proposalVersionId: 1,
										position: 1,
										value: 'This is a summary',
										isValid: true,
										createdAt: expectTimestamp,
										applicationFormField: {
											id: 1,
											applicationFormId: 1,
											baseFieldId: 1,
											baseField: {
												createdAt: expectTimestamp,
												dataType: 'string',
												description: 'A summary of the proposal',
												id: 1,
												label: 'Summary',
												scope: 'proposal',
												shortCode: 'summary',
												localizations: {},
											},
											label: 'Concise summary',
											position: 1,
											createdAt: expectTimestamp,
										},
									},
								],
							},
						],
					},
				],
			});
		});

		it('returns according to pagination parameters', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});

			const testUser = await loadTestUser();
			await Array.from(Array(20)).reduce(async (p, _, i) => {
				await p;
				await createProposal(db, null, {
					externalId: `proposal-${i + 1}`,
					opportunityId: 1,
					createdBy: testUser.keycloakUserId,
				});
			}, Promise.resolve());
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
						id: 15,
						externalId: 'proposal-15',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
					},
					{
						id: 14,
						externalId: 'proposal-14',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
					},
					{
						id: 13,
						externalId: 'proposal-13',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
					},
					{
						id: 12,
						externalId: 'proposal-12',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
					},
					{
						id: 11,
						externalId: 'proposal-11',
						opportunityId: 1,
						versions: [],
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
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
			const testUser = await loadTestUser();
			const response = await request(app)
				.get('/proposals/9001')
				.set(authHeader)
				.expect(404);
			expect(response.body).toEqual({
				name: 'NotFoundError',
				message: expect.any(String) as string,
				details: [
					{
						name: 'NotFoundError',
						details: {
							entityType: 'Proposal',
							lookupValues: {
								authContextIsAdministrator: false,
								authContextKeycloakUserId: testUser.keycloakUserId,
								proposalId: '9001',
							},
						},
					},
				],
			});
		});

		it('returns 404 when the current user does not have permission to view the provided id', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			const testUser = await loadTestUser();
			await createOpportunity(db, null, {
				title: '⛰️',
				funderShortCode: systemFunder.shortCode,
			});
			const anotherUser = await createOrUpdateUser(db, null, {
				keycloakUserId: '123e4567-e89b-12d3-a456-426614174000',
			});
			await createProposal(db, null, {
				externalId: `proposal-1`,
				opportunityId: 1,
				createdBy: anotherUser.keycloakUserId,
			});

			const response = await request(app)
				.get('/proposals/1')
				.set(authHeader)
				.expect(404);
			expect(response.body).toEqual({
				name: 'NotFoundError',
				message: expect.any(String) as string,
				details: [
					{
						name: 'NotFoundError',
						details: {
							entityType: 'Proposal',
							lookupValues: {
								authContextIsAdministrator: false,
								authContextKeycloakUserId: testUser.keycloakUserId,
								proposalId: '1',
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
				message: expect.any(String) as string,
				details: [expect.any(Object)],
			});
		});

		it('returns the one proposal asked for', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '⛰️',
				funderShortCode: systemFunder.shortCode,
			});

			const testUser = await loadTestUser();
			await createProposal(db, null, {
				externalId: `proposal-1`,
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposal(db, null, {
				externalId: `proposal-2`,
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});

			const response = await request(app)
				.get('/proposals/2')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				id: 2,
				externalId: 'proposal-2',
				versions: [],
				opportunityId: 1,
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
			});
		});

		it('returns one proposal with deep fields', async () => {
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🌎',
				funderShortCode: systemFunder.shortCode,
			});
			await createTestBaseFields();
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldId: 2,
				position: 1,
				label: 'Short summary or title',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldId: 1,
				position: 2,
				label: 'Long summary or abstract',
			});
			const testUser = await loadTestUser();
			const systemSource = await loadSystemSource(db, null);
			await createProposal(db, null, {
				externalId: `proposal-2525-01-04T00Z`,
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposalVersion(db, null, {
				proposalId: 1,
				applicationFormId: 1,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
			});
			await createProposalVersion(db, null, {
				proposalId: 1,
				applicationFormId: 1,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 1 from 2525-01-04',
				isValid: true,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 2,
				position: 2,
				value: 'Abstract for version 1 from 2525-01-04',
				isValid: true,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 2 from 2525-01-04',
				isValid: true,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 2,
				position: 2,
				value: 'Abstract for version 2 from 2525-01-04',
				isValid: true,
			});
			const response = await request(app)
				.get('/proposals/1')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				id: 1,
				opportunityId: 1,
				externalId: 'proposal-2525-01-04T00Z',
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
				versions: [
					{
						id: 2,
						proposalId: 1,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 2,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 3,
								proposalVersionId: 2,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 2 from 2525-01-04',
								isValid: true,
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldId: 2,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'The title of the proposal',
										id: 2,
										label: 'Title',
										scope: 'proposal',
										shortCode: 'title',
										localizations: {},
									},
									position: 1,
									label: 'Short summary or title',
									createdAt: expectTimestamp,
								},
							},
							{
								id: 4,
								proposalVersionId: 2,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 2 from 2525-01-04',
								isValid: true,
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldId: 1,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'A summary of the proposal',
										id: 1,
										label: 'Summary',
										scope: 'proposal',
										shortCode: 'summary',
										localizations: {},
									},
									position: 2,
									label: 'Long summary or abstract',
									createdAt: expectTimestamp,
								},
							},
						],
					},
					{
						id: 1,
						proposalId: 1,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 1,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 1,
								proposalVersionId: 1,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 1 from 2525-01-04',
								createdAt: expectTimestamp,
								isValid: true,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldId: 2,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'The title of the proposal',
										id: 2,
										label: 'Title',
										scope: 'proposal',
										shortCode: 'title',
										localizations: {},
									},
									position: 1,
									label: 'Short summary or title',
									createdAt: expectTimestamp,
								},
							},
							{
								id: 2,
								proposalVersionId: 1,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 1 from 2525-01-04',
								isValid: true,
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldId: 1,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'A summary of the proposal',
										id: 1,
										label: 'Summary',
										scope: 'proposal',
										shortCode: 'summary',
										localizations: {},
									},
									position: 2,
									label: 'Long summary or abstract',
									createdAt: expectTimestamp,
								},
							},
						],
					},
				],
			});
		});

		it('returns the proposal if an administrator requests a proposal they do not own', async () => {
			const testUser = await loadTestUser();
			const systemSource = await loadSystemSource(db, null);
			const systemFunder = await loadSystemFunder(db, null);
			await createTestBaseFields();
			await createOpportunity(db, null, {
				title: '🌎',
				funderShortCode: systemFunder.shortCode,
			});
			await createApplicationForm(db, null, {
				opportunityId: 1,
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldId: 2,
				position: 1,
				label: 'Short summary or title',
			});
			await createApplicationFormField(db, null, {
				applicationFormId: 1,
				baseFieldId: 1,
				position: 2,
				label: 'Long summary or abstract',
			});
			await createProposal(db, null, {
				externalId: `proposal-2525-01-04T00Z`,
				opportunityId: 1,
				createdBy: testUser.keycloakUserId,
			});
			await createProposalVersion(db, null, {
				proposalId: 1,
				applicationFormId: 1,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
			});
			await createProposalVersion(db, null, {
				proposalId: 1,
				applicationFormId: 1,
				sourceId: systemSource.id,
				createdBy: testUser.keycloakUserId,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 1 from 2525-01-04',
				isValid: true,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 1,
				applicationFormFieldId: 2,
				position: 2,
				value: 'Abstract for version 1 from 2525-01-04',
				isValid: true,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 1,
				position: 1,
				value: 'Title for version 2 from 2525-01-04',
				isValid: true,
			});
			await createProposalFieldValue(db, null, {
				proposalVersionId: 2,
				applicationFormFieldId: 2,
				position: 2,
				value: 'Abstract for version 2 from 2525-01-04',
				isValid: true,
			});
			const response = await request(app)
				.get('/proposals/1')
				.set(authHeaderWithAdminRole)
				.expect(200);
			expect(response.body).toEqual({
				id: 1,
				opportunityId: 1,
				externalId: 'proposal-2525-01-04T00Z',
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
				versions: [
					{
						id: 2,
						proposalId: 1,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 2,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 3,
								proposalVersionId: 2,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 2 from 2525-01-04',
								isValid: true,
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldId: 2,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'The title of the proposal',
										id: 2,
										label: 'Title',
										scope: 'proposal',
										shortCode: 'title',
										localizations: {},
									},
									position: 1,
									label: 'Short summary or title',
									createdAt: expectTimestamp,
								},
							},
							{
								id: 4,
								proposalVersionId: 2,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 2 from 2525-01-04',
								isValid: true,
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldId: 1,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'A summary of the proposal',
										id: 1,
										label: 'Summary',
										scope: 'proposal',
										shortCode: 'summary',
										localizations: {},
									},
									position: 2,
									label: 'Long summary or abstract',
									createdAt: expectTimestamp,
								},
							},
						],
					},
					{
						id: 1,
						proposalId: 1,
						sourceId: systemSource.id,
						source: systemSource,
						applicationFormId: 1,
						version: 1,
						createdAt: expectTimestamp,
						createdBy: testUser.keycloakUserId,
						fieldValues: [
							{
								id: 1,
								proposalVersionId: 1,
								applicationFormFieldId: 1,
								position: 1,
								value: 'Title for version 1 from 2525-01-04',
								createdAt: expectTimestamp,
								isValid: true,
								applicationFormField: {
									id: 1,
									applicationFormId: 1,
									baseFieldId: 2,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'The title of the proposal',
										id: 2,
										label: 'Title',
										scope: 'proposal',
										shortCode: 'title',
										localizations: {},
									},
									position: 1,
									label: 'Short summary or title',
									createdAt: expectTimestamp,
								},
							},
							{
								id: 2,
								proposalVersionId: 1,
								applicationFormFieldId: 2,
								position: 2,
								value: 'Abstract for version 1 from 2525-01-04',
								isValid: true,
								createdAt: expectTimestamp,
								applicationFormField: {
									id: 2,
									applicationFormId: 1,
									baseFieldId: 1,
									baseField: {
										createdAt: expectTimestamp,
										dataType: 'string',
										description: 'A summary of the proposal',
										id: 1,
										label: 'Summary',
										scope: 'proposal',
										shortCode: 'summary',
										localizations: {},
									},
									position: 2,
									label: 'Long summary or abstract',
									createdAt: expectTimestamp,
								},
							},
						],
					},
				],
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
			const systemFunder = await loadSystemFunder(db, null);
			await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			const before = await loadTableMetrics('proposals');
			const testUser = await loadTestUser();
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					externalId: 'proposal123',
					opportunityId: 1,
				})
				.expect(201);
			const after = await loadTableMetrics('proposals');
			expect(before.count).toEqual(0);
			expect(result.body).toMatchObject({
				id: 1,
				externalId: 'proposal123',
				opportunityId: 1,
				createdAt: expectTimestamp,
				createdBy: testUser.keycloakUserId,
			});
			expect(after.count).toEqual(1);
		});

		it('creates exactly one proposal when the user has write permissions on the opportunity funder', async () => {
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
			const before = await loadTableMetrics('proposals');
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					externalId: 'proposal123',
					opportunityId: 1,
				})
				.expect(201);
			const after = await loadTableMetrics('proposals');
			expect(result.body).toMatchObject({
				id: 1,
				externalId: 'proposal123',
				opportunityId: 1,
				createdAt: expectTimestamp,
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
				details: expect.any(Array) as unknown[],
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
				details: expect.any(Array) as unknown[],
			});
		});

		it('returns 422 conflict when a non-existent opportunity id is provided', async () => {
			const result = await request(app)
				.post('/proposals')
				.type('application/json')
				.set(authHeader)
				.send({
					externalId: 'proposal123',
					opportunityId: 1,
				})
				.expect(422);
			expect(result.body).toEqual({
				details: [
					{
						name: 'UnprocessableEntityError',
					},
				],
				message: 'The associated Opportunity was not found.',
				name: 'UnprocessableEntityError',
			});
		});
	});
});
