import { generateLoadBundleOperation } from '../generators';
import type { BaseFieldLocalization, ShortCode } from '../../../types';

const loadBaseFieldLocalizationsBundleByBaseFieldShortCode =
	generateLoadBundleOperation<
		BaseFieldLocalization,
		[baseFieldShortCode: ShortCode]
	>('baseFieldLocalizations.selectWithPagination', ['baseFieldShortCode']);

export { loadBaseFieldLocalizationsBundleByBaseFieldShortCode };
