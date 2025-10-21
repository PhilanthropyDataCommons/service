import { allNoLeaks } from '../promises';
import { decorateWithFileDownloadUrl } from './proposalFieldValue';
import type { ProposalVersion } from '../types';

const decorateWithFileDownloadUrls = async (
	proposalVersion: ProposalVersion,
): Promise<ProposalVersion> => {
	const decoratedFieldValues = await allNoLeaks(
		proposalVersion.fieldValues.map(decorateWithFileDownloadUrl),
	);
	return {
		...proposalVersion,
		fieldValues: decoratedFieldValues,
	};
};

export { decorateWithFileDownloadUrls };
