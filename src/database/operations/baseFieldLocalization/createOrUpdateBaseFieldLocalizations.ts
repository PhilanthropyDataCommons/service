import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	BaseFieldLocalization,
	InternallyWritableBaseFieldLocalization,
} from '../../../types';

const createOrUpdateBaseFieldLocalization = generateCreateOrUpdateItemOperation<
	BaseFieldLocalization,
	InternallyWritableBaseFieldLocalization,
	[]
>(
	'baseFieldLocalizations.createOrUpdateByPrimaryKey',
	['baseFieldId', 'language', 'label', 'description'],
	[],
);

export { createOrUpdateBaseFieldLocalization };
