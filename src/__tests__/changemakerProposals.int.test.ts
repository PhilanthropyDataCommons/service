import request from 'supertest';
import { app } from '../app';
import {
	db,
	createOpportunity,
	createChangemaker,
	createChangemakerFieldValue,
	createChangemakerFieldValueBatch,
	createChangemakerProposal,
	createProposal,
	createProposalVersion,
	createProposalFieldValue,
	createApplicationForm,
	createApplicationFormField,
	createOrUpdateBaseField,
	createSource,
	loadTableMetrics,
	loadSystemFunder,
	loadSystemUser,
	createOrUpdateFunder,
	createPermissionGrant,
} from '../database';
import { getAuthContext, loadTestUser } from '../test/utils';
import { createTestFile } from '../test/factories';
import {
	expectArray,
	expectObjectContaining,
	expectString,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import {
	BaseFieldCategory,
	BaseFieldDataType,
	BaseFieldSensitivityClassification,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
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
		keycloakOrganizationId: '402b1208-be48-11ef-8af9-b767e5e8e4ee',
	});
};

describe('/changemakerProposals', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/changemakerProposals').expect(401);
		});

		it('only returns the ChangemakerProposals that the user has rights to view', async () => {
			const anotherFunder = await loadSystemFunder(db, null);
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const visibleFunder = await createOrUpdateFunder(db, null, {
				name: 'Visible Funder',
				shortCode: 'visibleFunder',
				keycloakOrganizationId: null,
				isCollaborative: false,
			});
			const visibleChangemaker = await createChangemaker(db, null, {
				taxId: '11-1111111',
				name: 'Visible Changemaker',
				keycloakOrganizationId: null,
			});
			const anotherChangemaker = await createChangemaker(db, null, {
				taxId: '22-2222222',
				name: 'Another Changemaker',
				keycloakOrganizationId: '402b1208-be48-11ef-8af9-b767e5e8e4ee',
			});
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
			const visibleOpportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: visibleFunder.shortCode,
			});
			const anotherOpportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: anotherFunder.shortCode,
			});
			const funderVisibleProposal = await createProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: visibleOpportunity.id,
					externalId: 'visibleThroughFunder',
				},
			);
			const changemakerVisibleProposal = await createProposal(
				db,
				testUserAuthContext,
				{
					opportunityId: anotherOpportunity.id,
					externalId: 'visibleThroughChangemaker',
				},
			);
			const anotherProposal = await createProposal(db, testUserAuthContext, {
				opportunityId: anotherOpportunity.id,
				externalId: 'notVisible',
			});
			const changemakerVisibleChangemakerProposal =
				await createChangemakerProposal(db, null, {
					changemakerId: visibleChangemaker.id,
					proposalId: changemakerVisibleProposal.id,
				});
			const funderVisibleChangemakerProposal = await createChangemakerProposal(
				db,
				null,
				{
					changemakerId: anotherChangemaker.id,
					proposalId: funderVisibleProposal.id,
				},
			);
			await createChangemakerProposal(db, null, {
				changemakerId: anotherChangemaker.id,
				proposalId: anotherProposal.id,
			});

			const result = await request(app)
				.get(`/changemakerProposals`)
				.set(authHeader)
				.expect(200);

			expect(result.body).toEqual({
				entries: [
					funderVisibleChangemakerProposal,
					changemakerVisibleChangemakerProposal,
				],
				total: 3,
			});
		});

		it('returns the ChangemakerProposals for the specified changemaker', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
			});
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '2',
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
				.set(authHeaderWithAdminRole)
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
							createdAt: expectTimestamp(),
							fiscalSponsors: [],
							fields: [],
						},
						proposalId: 2,
						proposal: {
							id: 2,
							opportunityId: opportunity.id,
							opportunity,
							externalId: '2',
							versions: [],
							createdAt: expectTimestamp(),
							createdBy: testUser.keycloakUserId,
						},
						createdAt: expectTimestamp(),
					},
					{
						id: 1,
						changemakerId: 1,
						changemaker: {
							id: 1,
							name: 'Example Inc.',
							taxId: '11-1111111',
							keycloakOrganizationId: null,
							createdAt: expectTimestamp(),
							fiscalSponsors: [],
							fields: [],
						},
						proposalId: 1,
						proposal: {
							id: 1,
							opportunityId: opportunity.id,
							opportunity,
							externalId: '1',
							versions: [],
							createdAt: expectTimestamp(),
							createdBy: testUser.keycloakUserId,
						},
						createdAt: expectTimestamp(),
					},
				],
				total: 2,
			});
		});

		it('returns the ProposalChangemakers for the specified proposal', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
			});
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '2',
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
				.set(authHeaderWithAdminRole)
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
							createdAt: expectTimestamp(),
							fiscalSponsors: [],
							fields: [],
						},
						proposalId: 1,
						proposal: {
							id: 1,
							opportunityId: opportunity.id,
							opportunity,
							externalId: '1',
							versions: [],
							createdAt: expectTimestamp(),
							createdBy: testUser.keycloakUserId,
						},
						createdAt: expectTimestamp(),
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

		it('decorates proposal version file field values with downloadUrl', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			// Create a file-type base field (PROJECT category for proposal-only field)
			const baseFieldFile = await createOrUpdateBaseField(db, null, {
				label: 'Project Attachment',
				shortCode: 'project_attachment_cmp_test',
				description: 'An attachment for the project.',
				dataType: BaseFieldDataType.FILE,
				category: BaseFieldCategory.PROJECT,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const changemaker = await createChangemaker(db, null, {
				taxId: '88-8888883',
				name: 'Proposal File Decorated Changemaker',
				keycloakOrganizationId: null,
			});

			// Create a test file
			const testFile = await createTestFile(db, systemUserAuthContext, {
				name: 'project-attachment.pdf',
				mimeType: 'application/pdf',
				size: 25000,
			});

			// Create funder source
			const funderSource = await createSource(db, null, {
				funderShortCode: systemFunder.shortCode,
				label: 'Proposal Version File Funder Source',
			});

			// Create opportunity and proposal
			const opportunity = await createOpportunity(db, null, {
				title: 'Proposal Version File Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});
			const proposal = await createProposal(db, systemUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: 'proposal-version-file-test',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: changemaker.id,
				proposalId: proposal.id,
			});

			// Create application form and field
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
				label: 'Project Attachment',
				applicationFormId: applicationForm.id,
				baseFieldShortCode: baseFieldFile.shortCode,
				position: 1,
				instructions: 'Upload project attachment',
			});

			// Create ProposalFieldValue with file
			await createProposalFieldValue(db, null, {
				proposalVersionId: proposalVersion.id,
				applicationFormFieldId: applicationFormField.id,
				position: 1,
				value: testFile.id.toString(),
				isValid: true,
				goodAsOf: null,
			});

			await request(app)
				.get(`/changemakerProposals?changemaker=${changemaker.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					// The file should appear in proposal.versions[].fieldValues with downloadUrl
					expect(res.body).toMatchObject({
						entries: [
							expectObjectContaining({
								proposal: expectObjectContaining({
									id: proposal.id,
									versions: [
										expectObjectContaining({
											id: proposalVersion.id,
											fieldValues: [
												expectObjectContaining({
													value: testFile.id.toString(),
													file: expectObjectContaining({
														id: testFile.id,
														name: 'project-attachment.pdf',
														downloadUrl: expectString(),
													}),
												}),
											],
										}),
									],
								}),
							}),
						],
					});
				});
		});

		it('decorates changemaker field values with downloadUrl', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const systemFunder = await loadSystemFunder(db, null);

			// Create a file-type base field (ORGANIZATION category for changemaker fields)
			const baseFieldFile = await createOrUpdateBaseField(db, null, {
				label: 'Org Document CMP',
				shortCode: 'org_document_cmp_test',
				description: 'A document associated with the organization.',
				dataType: BaseFieldDataType.FILE,
				category: BaseFieldCategory.ORGANIZATION,
				valueRelevanceHours: null,
				sensitivityClassification:
					BaseFieldSensitivityClassification.RESTRICTED,
			});

			const changemaker = await createChangemaker(db, null, {
				taxId: '88-8888884',
				name: 'Changemaker File Decorated Changemaker',
				keycloakOrganizationId: null,
			});

			// Create a test file
			const testFile = await createTestFile(db, systemUserAuthContext, {
				name: 'org-document.pdf',
				mimeType: 'application/pdf',
				size: 30000,
			});

			// Create changemaker-sourced source and batch for changemaker field values
			const changemakerSource = await createSource(db, null, {
				changemakerId: changemaker.id,
				label: `${changemaker.name} source`,
			});
			const batch = await createChangemakerFieldValueBatch(
				db,
				systemUserAuthContext,
				{
					sourceId: changemakerSource.id,
					notes: 'CMP file download URL test batch',
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

			// Create a proposal to link to the changemaker
			const opportunity = await createOpportunity(db, null, {
				title: 'CMP Changemaker Field Test Opportunity',
				funderShortCode: systemFunder.shortCode,
			});
			const proposal = await createProposal(db, systemUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: 'cmp-changemaker-field-test',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: changemaker.id,
				proposalId: proposal.id,
			});

			await request(app)
				.get(`/changemakerProposals?changemaker=${changemaker.id}`)
				.set(authHeaderWithAdminRole)
				.expect(200)
				.expect((res) => {
					// The file should appear in changemaker.fields with downloadUrl
					expect(res.body).toMatchObject({
						entries: [
							expectObjectContaining({
								changemaker: expectObjectContaining({
									id: changemaker.id,
									fields: [
										expectObjectContaining({
											changemakerId: changemaker.id,
											baseFieldShortCode: baseFieldFile.shortCode,
											value: testFile.id.toString(),
											file: expectObjectContaining({
												id: testFile.id,
												name: 'org-document.pdf',
												downloadUrl: expectString(),
											}),
										}),
									],
								}),
							}),
						],
					});
				});
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/changemakerProposals').expect(401);
		});

		it('creates exactly one ChangemakerProposal when the user is an administrator', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
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
					createdAt: expectTimestamp(),
					fiscalSponsors: [],
					fields: [],
				},
				proposalId: 1,
				proposal: {
					id: 1,
					opportunityId: opportunity.id,
					opportunity,
					externalId: '1',
					versions: [],
					createdAt: expectTimestamp(),
					createdBy: testUser.keycloakUserId,
				},
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(1);
		});

		it('creates exactly one ChangemakerProposal when the user has write and view permission on the funder associated with the proposal opportunity', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [
					PermissionGrantEntityType.FUNDER,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW, PermissionGrantVerb.EDIT],
			});
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
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
					createdAt: expectTimestamp(),
					fiscalSponsors: [],
					fields: [],
				},
				proposalId: 1,
				proposal: {
					id: 1,
					opportunityId: opportunity.id,
					opportunity,
					externalId: '1',
					versions: [],
					createdAt: expectTimestamp(),
					createdBy: testUser.keycloakUserId,
				},
				createdAt: expectTimestamp(),
			});
			expect(after.count).toEqual(before.count + 1);
		});

		it('returns 422 Unprocessable Content if the user does not have edit permission on the funder associated with the proposal opportunity', async () => {
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [
					PermissionGrantEntityType.FUNDER,
					PermissionGrantEntityType.PROPOSAL,
				],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
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
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
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
				details: expectArray(),
			});
		});

		it('returns 400 bad request when no changemakerId is sent', async () => {
			const testUser = await loadTestUser();
			const testUserAuthContext = getAuthContext(testUser);
			const systemFunder = await loadSystemFunder(db, null);
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
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
				details: expectArray(),
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
				.set(authHeaderWithAdminRole)
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
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
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
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
			});
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeaderWithAdminRole)
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
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser();
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
			const opportunity = await createOpportunity(db, null, {
				title: '🔥',
				funderShortCode: systemFunder.shortCode,
			});
			await insertTestChangemakers();
			await createProposal(db, testUserAuthContext, {
				opportunityId: opportunity.id,
				externalId: '1',
			});
			await createChangemakerProposal(db, null, {
				changemakerId: 1,
				proposalId: 1,
			});
			const result = await request(app)
				.post('/changemakerProposals')
				.type('application/json')
				.set(authHeaderWithAdminRole)
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
