import { decorateWithDownloadUrl } from './file';
import type { ProposalFieldValue } from '../types';

const decorateWithFileDownloadUrl = async (
	proposalFieldValue: ProposalFieldValue,
): Promise<ProposalFieldValue> => {
	if (proposalFieldValue.file === null) {
		return proposalFieldValue;
	}
	const decoratedFile = await decorateWithDownloadUrl(proposalFieldValue.file);
	return {
		...proposalFieldValue,
		file: decoratedFile,
	};
};

export { decorateWithFileDownloadUrl };
