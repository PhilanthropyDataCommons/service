import { generateLoadItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/initiativeFieldValue';
import type { Id, InitiativeFieldValue } from '../../../types';

const loadInitiativeFieldValue = generateLoadItemOperation<
	InitiativeFieldValue,
	[initiativeId: Id, initiativeFieldValueId: Id]
>(
	'initiativeFieldValues.selectById',
	'InitiativeFieldValue',
	['initiativeId', 'initiativeFieldValueId'],
	decorateWithFileDownloadUrl,
);

export { loadInitiativeFieldValue };
