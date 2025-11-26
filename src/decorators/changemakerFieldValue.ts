import { decorateWithDownloadUrl } from './file';
import type { ChangemakerFieldValue } from '../types';

const decorateWithFileDownloadUrl = async (
	changemakerFieldValue: ChangemakerFieldValue,
): Promise<ChangemakerFieldValue> => {
	if (changemakerFieldValue.file === null) {
		return changemakerFieldValue;
	}
	const decoratedFile = await decorateWithDownloadUrl(
		changemakerFieldValue.file,
	);
	return {
		...changemakerFieldValue,
		file: decoratedFile,
	};
};

export { decorateWithFileDownloadUrl };
