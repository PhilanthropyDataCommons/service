import { allNoLeaks } from '../promises';
import { decorateWithFileDownloadUrl as decorateChangemakerFieldValue } from './changemakerFieldValue';
import { decorateWithFileDownloadUrl as decorateProposalFieldValue } from './proposalFieldValue';
import type {
	Changemaker,
	ChangemakerFieldValue,
	ProposalFieldValue,
} from '../types';

const isChangemakerFieldValue = (
	fieldValue: ChangemakerFieldValue | ProposalFieldValue,
): fieldValue is ChangemakerFieldValue =>
	'baseFieldShortCode' in fieldValue && 'batchId' in fieldValue;

const decorateFieldValue = async (
	fieldValue: ChangemakerFieldValue | ProposalFieldValue,
): Promise<ChangemakerFieldValue | ProposalFieldValue> => {
	if (isChangemakerFieldValue(fieldValue)) {
		return await decorateChangemakerFieldValue(fieldValue);
	}
	return await decorateProposalFieldValue(fieldValue);
};

const decorateWithFileDownloadUrls = async (
	changemaker: Changemaker,
): Promise<Changemaker> => {
	const decoratedFields = await allNoLeaks(
		changemaker.fields.map(decorateFieldValue),
	);
	return {
		...changemaker,
		fields: decoratedFields,
	};
};

export { decorateWithFileDownloadUrls };
