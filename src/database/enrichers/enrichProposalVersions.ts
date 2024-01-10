import { loadObjects } from '../operations/load/loadObjects';
import { isProposalFieldValue } from '../../types';
import { enrichProposalFieldValues } from './enrichProposalFieldValues';
import type { ProposalVersion } from '../../types';

export const enrichProposalVersions = async (
	proposalVersions: ProposalVersion[],
): Promise<ProposalVersion[]> => {
	const proposalFieldValues = await enrichProposalFieldValues(
		await loadObjects(
			'proposalFieldValues.selectByProposalVersionIds',
			{
				proposalVersionIds: proposalVersions.map(
					(proposalVersion) => proposalVersion.id,
				),
			},
			isProposalFieldValue,
		),
	);

	return proposalVersions.map((proposalVersion) => ({
		...proposalVersion,
		fieldValues: proposalFieldValues.filter(
			({ proposalVersionId }) => proposalVersionId === proposalVersion.id,
		),
	}));
};
