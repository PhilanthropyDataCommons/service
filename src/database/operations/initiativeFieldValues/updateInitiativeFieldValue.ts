import { generateUpdateItemOperation } from '../generators';
import { decorateWithFileDownloadUrl } from '../../../decorators/initiativeFieldValue';
import type {
	Id,
	InitiativeFieldValue,
	InternallyWritableInitiativeFieldValuePatch,
} from '../../../types';

const updateInitiativeFieldValue = generateUpdateItemOperation<
	InitiativeFieldValue,
	InternallyWritableInitiativeFieldValuePatch,
	[initiativeId: Id, initiativeFieldValueId: Id]
>(
	'initiativeFieldValues.updateById',
	['value', 'sourceId', 'goodAsOf', 'isValid'],
	['initiativeId', 'initiativeFieldValueId'],
	decorateWithFileDownloadUrl,
);

export { updateInitiativeFieldValue };
