import { allNoLeaks } from '../promises';
import { decorateWithFileDownloadUrls as decorateWithFileDownloadUrlsForProposalVersion } from './proposalVersion';
import type { Proposal } from '../types';

const decorateWithFileDownloadUrls = async (
	proposal: Proposal,
): Promise<Proposal> => {
	const decoratedVersions = await allNoLeaks(
		proposal.versions.map(decorateWithFileDownloadUrlsForProposalVersion),
	);
	return {
		...proposal,
		versions: decoratedVersions,
	};
};

export { decorateWithFileDownloadUrls };
