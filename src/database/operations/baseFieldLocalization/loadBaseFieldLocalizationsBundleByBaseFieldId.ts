import { generateLoadBundleOperation } from '../generators';
import type { BaseFieldLocalization, ShortCode } from '../../../types';

const loadBaseFieldLocalizationsBundleByBaseFieldId =
	generateLoadBundleOperation<
		BaseFieldLocalization,
		[baseFieldShortCode: ShortCode]
	>('baseFieldLocalizations.selectWithPagination', 'base_field_localizations', [
		'baseFieldShortCode',
	]);

export { loadBaseFieldLocalizationsBundleByBaseFieldId };
