import { decorateWithDownloadUrl } from './file';
import type { InitiativeFieldValue } from '../types';

const decorateWithFileDownloadUrl = async (
	initiativeFieldValue: InitiativeFieldValue,
): Promise<InitiativeFieldValue> => {
	if (initiativeFieldValue.file === null) {
		return initiativeFieldValue;
	}
	const decoratedFile = await decorateWithDownloadUrl(
		initiativeFieldValue.file,
	);
	return {
		...initiativeFieldValue,
		file: decoratedFile,
	};
};

export { decorateWithFileDownloadUrl };
