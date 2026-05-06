import { generateUpsertItemOperation } from '../generators';
import type {
	BaseFieldLocalization,
	InternallyWritableBaseFieldLocalization,
} from '../../../types';

const createOrUpdateBaseFieldLocalization = generateUpsertItemOperation<
	BaseFieldLocalization,
	InternallyWritableBaseFieldLocalization,
	[]
>(
	'baseFieldLocalizations.createOrUpdateByPrimaryKey',
	['baseFieldShortCode', 'language', 'label', 'description'],
	[],
);

export { createOrUpdateBaseFieldLocalization };
