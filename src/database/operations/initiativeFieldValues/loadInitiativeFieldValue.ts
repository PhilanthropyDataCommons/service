import { generateLoadItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/initiativeFieldValue';
import type { Id, InitiativeFieldValue } from '../../../types';

const loadInitiativeFieldValue = generateLoadItemOperation<
	InitiativeFieldValue,
	[initiativeFieldValueId: Id]
>(
	'initiativeFieldValues.selectById',
	'InitiativeFieldValue',
	['initiativeFieldValueId'],
	decorateWithFileDownloadUrl,
);

export { loadInitiativeFieldValue };
