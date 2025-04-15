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
	['baseFieldShortCode', 'language', 'label', 'description'],
	[],
);

export { createOrUpdateBaseFieldLocalization };
