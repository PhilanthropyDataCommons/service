import {
	createApplicationForm,
	createApplicationFormField,
	createOpportunity,
	createOrUpdateBaseField,
	createProposal,
	createProposalFieldValue,
	createProposalVersion,
	db,
	loadSystemFunder,
	loadSystemSource,
} from '../..';
import { getAuthContext, loadTestUser } from '../../../test/utils';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
} from '../../../types';

describe('/proposal_field_value_to_json', () => {
	it('returns a db error if attempting to load a forbidden proposal_field_value_to_json', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const systemSource = await loadSystemSource(db, null);
		const systemFunder = await loadSystemFunder(db, null);
		const opportunity = await createOpportunity(db, null, {
			title: '🔥',
			funderShortCode: systemFunder.shortCode,
		});
		const proposal = await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-1',
			opportunityId: opportunity.id,
		});
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId: opportunity.id,
		});
		const forbiddenBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Forbidden Field',
			description: 'This field should not be used in proposal versions',
			shortCode: 'forbiddenField',
			dataType: BaseFieldDataType.STRING,
			category: BaseFieldCategory.PROJECT,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		});
		const forbiddenApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: applicationForm.id,
				baseFieldShortCode: forbiddenBaseField.shortCode,
				position: 1,
				label: 'Forbidden Field',
				instructions: 'This field should not be used in proposal versions',
			},
		);
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
			applicationFormFieldId: forbiddenApplicationFormField.id,
			position: 1,
			value: 'Should not be returned',
			isValid: true,
			goodAsOf: null,
		});
		await createOrUpdateBaseField(db, null, {
			...forbiddenBaseField,
			sensitivityClassification: BaseFieldSensitivityClassification.FORBIDDEN,
		});

		await expect(
			db.query(
				'SELECT proposal_field_value_to_json(proposal_field_values.*) FROM proposal_field_values WHERE proposal_field_values.id = 1',
			),
		).rejects.toThrow(
			'Attempt to convert forbidden proposal_field_value to JSON (1)',
		);
	});
});
