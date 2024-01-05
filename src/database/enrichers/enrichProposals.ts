import { loadObjects } from '../operations/load/loadObjects';
import { isProposalVersion } from '../../types';
import { enrichProposalVersions } from './enrichProposalVersions';
import type { Proposal } from '../../types';

export const enrichProposals = async (proposals: Proposal[]): Promise<Proposal[]> => {
  const proposalVersions = await enrichProposalVersions(
    await loadObjects(
      'proposalVersions.selectByProposalIds',
      {
        proposalIds: proposals.map((proposal) => proposal.id),
      },
      isProposalVersion,
    ),
  );

  return proposals.map((proposal) => ({
    ...proposal,
    versions: proposalVersions.filter(
      ({ proposalId }) => proposalId === proposal.id,
    ),
  }));
};
