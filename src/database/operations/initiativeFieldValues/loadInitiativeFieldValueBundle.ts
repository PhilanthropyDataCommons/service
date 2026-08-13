import { generateLoadBundleOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/initiativeFieldValue';
import type { Id, InitiativeFieldValue } from '../../../types';

const loadInitiativeFieldValueBundle = generateLoadBundleOperation<
	InitiativeFieldValue,
	[initiativeId: Id]
>(
	'initiativeFieldValues.selectWithPagination',
	['initiativeId'],
	decorateWithFileDownloadUrl,
);

export { loadInitiativeFieldValueBundle };
