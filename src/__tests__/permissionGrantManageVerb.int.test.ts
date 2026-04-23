import {
	createApplicationForm,
	createApplicationFormField,
	createChangemakerFieldValue,
	createChangemakerFieldValueBatch,
	createPermissionGrant,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	createSource,
	getDatabase,
	hasChangemakerFieldValuePermission,
	hasChangemakerPermission,
	hasDataProviderPermission,
	hasFunderPermission,
	hasOpportunityPermission,
	hasProposalFieldValuePermission,
	hasProposalPermission,
	hasSourcePermission,
	loadSystemSource,
} from '../database';
import {
	createTestBaseField,
	createTestChangemaker,
	createTestDataProvider,
	createTestFunder,
	createTestOpportunity,
} from '../test/factories';
import { getAuthContext, loadTestUser } from '../test/utils';
import {
	BaseFieldCategory,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';

const NON_MANAGE_VERBS: PermissionGrantVerb[] = [
	PermissionGrantVerb.VIEW,
	PermissionGrantVerb.CREATE,
	PermissionGrantVerb.EDIT,
	PermissionGrantVerb.DELETE,
	PermissionGrantVerb.REFERENCE,
];

const expectAllTrue = async (
	checks: Array<Promise<boolean>>,
): Promise<void> => {
	const results = await Promise.all(checks);
	results.forEach((result) => {
		expect(result).toBe(true);
	});
};

describe('`manage` verb semantics', () => {
	it('satisfies any verb check on a funder grant whose scope matches', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const funder = await createTestFunder(db, testUserAuthContext);

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: funder.shortCode,
			scope: [
				PermissionGrantEntityType.FUNDER,
				PermissionGrantEntityType.OPPORTUNITY,
			],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await expectAllTrue(
			NON_MANAGE_VERBS.flatMap((verb) => [
				hasFunderPermission(db, testUserAuthContext, {
					funderShortCode: funder.shortCode,
					permission: verb,
					scope: PermissionGrantEntityType.FUNDER,
				}),
				hasFunderPermission(db, testUserAuthContext, {
					funderShortCode: funder.shortCode,
					permission: verb,
					scope: PermissionGrantEntityType.OPPORTUNITY,
				}),
			]),
		);
		// A scope absent from the grant is not covered, even though the same
		// grant confers manage on sibling scopes.
		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.PROPOSAL,
			}),
		).toBe(false);
	});

	it('satisfies any verb check on a changemaker grant whose scope matches', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const changemaker = await createTestChangemaker(db, testUserAuthContext);
		const source = await createSource(db, testUserAuthContext, {
			label: 'Source under changemaker',
			changemakerId: changemaker.id,
		});
		const baseField = await createTestBaseField(db, null);
		const batch = await createChangemakerFieldValueBatch(
			db,
			testUserAuthContext,
			{ sourceId: source.id, notes: null },
		);
		const cfv = await createChangemakerFieldValue(db, testUserAuthContext, {
			changemakerId: changemaker.id,
			baseFieldShortCode: baseField.shortCode,
			batchId: batch.id,
			value: 'Some value',
			isValid: true,
			goodAsOf: null,
		});

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
			changemakerId: changemaker.id,
			scope: [
				PermissionGrantEntityType.CHANGEMAKER,
				PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
			],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await expectAllTrue(
			NON_MANAGE_VERBS.flatMap((verb) => [
				hasChangemakerPermission(db, testUserAuthContext, {
					changemakerId: changemaker.id,
					permission: verb,
					scope: PermissionGrantEntityType.CHANGEMAKER,
				}),
				hasChangemakerFieldValuePermission(db, testUserAuthContext, {
					changemakerFieldValueId: cfv.id,
					permission: verb,
					scope: PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
				}),
			]),
		);
	});

	it('satisfies any verb check on an opportunity-inherited proposal grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const opportunity = await createTestOpportunity(db, testUserAuthContext);
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'opp-manage-proposal',
			opportunityId: opportunity.id,
		});

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.OPPORTUNITY,
			opportunityId: opportunity.id,
			scope: [
				PermissionGrantEntityType.OPPORTUNITY,
				PermissionGrantEntityType.PROPOSAL,
			],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await expectAllTrue(
			NON_MANAGE_VERBS.flatMap((verb) => [
				hasOpportunityPermission(db, testUserAuthContext, {
					opportunityId: opportunity.id,
					permission: verb,
					scope: PermissionGrantEntityType.OPPORTUNITY,
				}),
				hasProposalPermission(db, testUserAuthContext, {
					proposalId: proposal.id,
					permission: verb,
					scope: PermissionGrantEntityType.PROPOSAL,
				}),
			]),
		);
	});

	it('satisfies any verb check on a direct proposal grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const opportunity = await createTestOpportunity(db, testUserAuthContext);
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-manage-proposal',
			opportunityId: opportunity.id,
		});

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.PROPOSAL,
			proposalId: proposal.id,
			scope: [PermissionGrantEntityType.PROPOSAL],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await expectAllTrue(
			NON_MANAGE_VERBS.map(
				async (verb) =>
					await hasProposalPermission(db, testUserAuthContext, {
						proposalId: proposal.id,
						permission: verb,
						scope: PermissionGrantEntityType.PROPOSAL,
					}),
			),
		);
	});

	it('satisfies any verb check on a dataProvider-inherited source grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const dataProvider = await createTestDataProvider(db, testUserAuthContext);
		const source = await createSource(db, testUserAuthContext, {
			label: 'DP-owned Source',
			dataProviderShortCode: dataProvider.shortCode,
		});

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.DATA_PROVIDER,
			dataProviderShortCode: dataProvider.shortCode,
			scope: [
				PermissionGrantEntityType.DATA_PROVIDER,
				PermissionGrantEntityType.SOURCE,
			],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await expectAllTrue(
			NON_MANAGE_VERBS.flatMap((verb) => [
				hasDataProviderPermission(db, testUserAuthContext, {
					dataProviderShortCode: dataProvider.shortCode,
					permission: verb,
					scope: PermissionGrantEntityType.DATA_PROVIDER,
				}),
				hasSourcePermission(db, testUserAuthContext, {
					sourceId: source.id,
					permission: verb,
					scope: PermissionGrantEntityType.SOURCE,
				}),
			]),
		);
	});

	it('satisfies any verb check on a direct source grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const changemaker = await createTestChangemaker(db, testUserAuthContext);
		const source = await createSource(db, testUserAuthContext, {
			label: 'Directly granted source',
			changemakerId: changemaker.id,
		});

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.SOURCE,
			sourceId: source.id,
			scope: [PermissionGrantEntityType.SOURCE],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await expectAllTrue(
			NON_MANAGE_VERBS.map(
				async (verb) =>
					await hasSourcePermission(db, testUserAuthContext, {
						sourceId: source.id,
						permission: verb,
						scope: PermissionGrantEntityType.SOURCE,
					}),
			),
		);
	});

	it('does not grant access to a scope outside the grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const funder = await createTestFunder(db, testUserAuthContext);

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: funder.shortCode,
			scope: [PermissionGrantEntityType.PROPOSAL],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		// Manage on proposal scope does not confer access to the funder scope.
		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.FUNDER,
			}),
		).toBe(false);
		// And does not confer access to the opportunity scope.
		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.OPPORTUNITY,
			}),
		).toBe(false);
	});

	it('does not leak a manage grant from one funder to another', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const ownedFunder = await createTestFunder(db, testUserAuthContext);
		const otherFunder = await createTestFunder(db, testUserAuthContext);

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: ownedFunder.shortCode,
			scope: [PermissionGrantEntityType.FUNDER],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: ownedFunder.shortCode,
				permission: PermissionGrantVerb.EDIT,
				scope: PermissionGrantEntityType.FUNDER,
			}),
		).toBe(true);
		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: otherFunder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.FUNDER,
			}),
		).toBe(false);
	});

	it('honors conditions on a conditional manage grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const funder = await createTestFunder(db, testUserAuthContext);
		const opportunity = await createTestOpportunity(db, testUserAuthContext, {
			funderShortCode: funder.shortCode,
		});
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'conditional-manage-proposal',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
			name: null,
		});
		const systemSource = await loadSystemSource(db, null);
		const proposalVersion = await createProposalVersion(
			db,
			testUserAuthContext,
			{
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
			},
		);
		const budgetField = await createTestBaseField(db, null, {
			category: BaseFieldCategory.BUDGET,
		});
		const projectField = await createTestBaseField(db, null, {
			category: BaseFieldCategory.PROJECT,
		});
		const budgetApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: budgetField.shortCode,
				position: 1,
				label: 'Budget',
				instructions: 'budget',
				inputType: null,
			},
		);
		const projectApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: projectField.shortCode,
				position: 2,
				label: 'Project',
				instructions: 'project',
				inputType: null,
			},
		);
		const budgetValue = await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: budgetApplicationFormField.id,
			position: 1,
			value: 'Budget value',
			isValid: true,
			goodAsOf: null,
		});
		const projectValue = await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: projectApplicationFormField.id,
			position: 2,
			value: 'Project value',
			isValid: true,
			goodAsOf: null,
		});

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: funder.shortCode,
			scope: [PermissionGrantEntityType.PROPOSAL_FIELD_VALUE],
			verbs: [PermissionGrantVerb.MANAGE],
			conditions: {
				[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: {
					property: 'baseFieldCategory',
					operator: 'in',
					value: [BaseFieldCategory.BUDGET],
				},
			},
		});

		expect(
			await hasProposalFieldValuePermission(db, testUserAuthContext, {
				proposalFieldValueId: budgetValue.id,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
			}),
		).toBe(true);
		expect(
			await hasProposalFieldValuePermission(db, testUserAuthContext, {
				proposalFieldValueId: projectValue.id,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
			}),
		).toBe(false);
	});

	it('a view-only grant does not imply edit or create', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const funder = await createTestFunder(db, testUserAuthContext);

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: funder.shortCode,
			scope: [PermissionGrantEntityType.FUNDER],
			verbs: [PermissionGrantVerb.VIEW],
		});

		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.VIEW,
				scope: PermissionGrantEntityType.FUNDER,
			}),
		).toBe(true);
		expect(
			await hasFunderPermission(db, testUserAuthContext, {
				funderShortCode: funder.shortCode,
				permission: PermissionGrantVerb.EDIT,
				scope: PermissionGrantEntityType.FUNDER,
			}),
		).toBe(false);
	});

	it('extends to proposal field values via an inherited funder grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const testUserAuthContext = getAuthContext(testUser);
		const adminAuthContext = getAuthContext(testUser, true);
		const funder = await createTestFunder(db, testUserAuthContext);
		const opportunity = await createTestOpportunity(db, testUserAuthContext, {
			funderShortCode: funder.shortCode,
		});
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'pfv-inherited-proposal',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
			name: null,
		});
		const systemSource = await loadSystemSource(db, null);
		const proposalVersion = await createProposalVersion(
			db,
			testUserAuthContext,
			{
				proposalId: proposal.id,
				applicationFormId: applicationForm.id,
				sourceId: systemSource.id,
			},
		);
		const baseField = await createTestBaseField(db, null);
		const applicationFormField = await createApplicationFormField(db, null, {
			applicationFormId: applicationForm.id,
			baseFieldShortCode: baseField.shortCode,
			position: 1,
			label: 'Field',
			instructions: 'field',
			inputType: null,
		});
		const pfv = await createProposalFieldValue(db, null, {
			proposalVersionId: proposalVersion.id,
			applicationFormFieldId: applicationFormField.id,
			position: 1,
			value: 'Value',
			isValid: true,
			goodAsOf: null,
		});

		await createPermissionGrant(db, adminAuthContext, {
			granteeType: PermissionGrantGranteeType.USER,
			granteeUserKeycloakUserId: testUser.keycloakUserId,
			contextEntityType: PermissionGrantEntityType.FUNDER,
			funderShortCode: funder.shortCode,
			scope: [PermissionGrantEntityType.PROPOSAL_FIELD_VALUE],
			verbs: [PermissionGrantVerb.MANAGE],
		});

		await expectAllTrue(
			NON_MANAGE_VERBS.map(
				async (verb) =>
					await hasProposalFieldValuePermission(db, testUserAuthContext, {
						proposalFieldValueId: pfv.id,
						permission: verb,
						scope: PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
					}),
			),
		);
	});
});
