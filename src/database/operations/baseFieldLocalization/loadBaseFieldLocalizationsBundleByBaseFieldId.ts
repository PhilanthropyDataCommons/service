import { generateLoadBundleOperation } from '../generators';
import type { BaseFieldLocalization } from '../../../types';

const loadBaseFieldLocalizationsBundleByBaseFieldId =
	generateLoadBundleOperation<BaseFieldLocalization, [baseFieldId: number]>(
		'baseFieldLocalizations.selectWithPagination',
		'base_field_localizations',
		['baseFieldId'],
	);

export { loadBaseFieldLocalizationsBundleByBaseFieldId };
