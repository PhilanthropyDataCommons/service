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
	BaseFieldScope,
	BaseFieldSensitivityClassification,
} from '../../../types';

describe('/proposal_field_value_to_json', () => {
	it('returns a db error if attempting to load a forbidden proposal_field_value_to_json', async () => {
		const testUser = await loadTestUser();
		const testUserAuthContext = getAuthContext(testUser);
		const systemSource = await loadSystemSource(db, null);
		const systemFunder = await loadSystemFunder(db, null);
		await createOpportunity(db, null, {
			title: '🔥',
			funderShortCode: systemFunder.shortCode,
		});
		await createProposal(db, testUserAuthContext, {
			externalId: 'proposal-1',
			opportunityId: 1,
		});
		await createApplicationForm(db, null, {
			opportunityId: 1,
		});
		const forbiddenBaseField = await createOrUpdateBaseField(db, null, {
			label: 'Forbidden Field',
			description: 'This field should not be used in proposal versions',
			shortCode: 'forbiddenField',
			dataType: BaseFieldDataType.STRING,
			scope: BaseFieldScope.PROPOSAL,
			valueRelevanceHours: null,
			sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		});
		const forbiddenApplicationFormField = await createApplicationFormField(
			db,
			null,
			{
				applicationFormId: 1,
				baseFieldShortCode: forbiddenBaseField.shortCode,
				position: 1,
				label: 'Forbidden Field',
			},
		);
		await createProposal(db, testUserAuthContext, {
			externalId: `proposal-2525-01-04T00Z`,
			opportunityId: 1,
		});
		await createProposalVersion(db, testUserAuthContext, {
			proposalId: 1,
			applicationFormId: 1,
			sourceId: systemSource.id,
		});
		await createProposalFieldValue(db, null, {
			proposalVersionId: 1,
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
