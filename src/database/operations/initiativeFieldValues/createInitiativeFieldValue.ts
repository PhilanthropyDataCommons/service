import { generateCreateItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/initiativeFieldValue';
import type {
	InitiativeFieldValue,
	InternallyWritableInitiativeFieldValue,
} from '../../../types';

const createInitiativeFieldValue = generateCreateItemOperation<
	InitiativeFieldValue,
	InternallyWritableInitiativeFieldValue,
	[]
>(
	'initiativeFieldValues.insertOne',
	[
		'initiativeId',
		'baseFieldShortCode',
		'sourceId',
		'value',
		'isValid',
		'goodAsOf',
	],
	[],
	decorateWithFileDownloadUrl,
);

export { createInitiativeFieldValue };
