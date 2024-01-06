import { loadObjects } from '../operations/load/loadObjects';
import { isApplicationFormField } from '../../types';
import type { ProposalFieldValue } from '../../types';

export const enrichProposalFieldValues = async (
	proposalFieldValues: ProposalFieldValue[],
): Promise<ProposalFieldValue[]> => {
	const applicationFormFields = await loadObjects(
		'applicationFormFields.selectByIds',
		{
			ids: proposalFieldValues.map(
				(proposalFieldValue) => proposalFieldValue.applicationFormFieldId,
			),
		},
		isApplicationFormField,
	);

	return proposalFieldValues.map((proposalFieldValue) => ({
		...proposalFieldValue,
		applicationFormField: applicationFormFields.find(
			({ id }) => id === proposalFieldValue.applicationFormFieldId,
		),
	}));
};
