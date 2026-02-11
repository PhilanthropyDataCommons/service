import { decorateWithFileDownloadUrls as decorateChangemaker } from './changemaker';
import { decorateWithFileDownloadUrls as decorateProposal } from './proposal';
import type { ChangemakerProposal } from '../types';

const decorateWithFileDownloadUrls = async (
	changemakerProposal: ChangemakerProposal,
): Promise<ChangemakerProposal> => {
	const decoratedChangemaker = await decorateChangemaker(
		changemakerProposal.changemaker,
	);
	const decoratedProposal = await decorateProposal(
		changemakerProposal.proposal,
	);
	return {
		...changemakerProposal,
		changemaker: decoratedChangemaker,
		proposal: decoratedProposal,
	};
};

export { decorateWithFileDownloadUrls };
