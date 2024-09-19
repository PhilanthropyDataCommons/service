import { loadBundle } from '../generic/loadBundle';
import type {
	Bundle,
	JsonResultSet,
	BaseFieldLocalization,
} from '../../../types';

const loadBaseFieldLocalizationsBundleByBaseFieldId = async (
	baseFieldId: number,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<BaseFieldLocalization>> => {
	const bundle = await loadBundle<JsonResultSet<BaseFieldLocalization>>(
		'baseFieldLocalizations.selectWithPagination',
		{
			baseFieldId,
			limit,
			offset,
		},
		'base_field_localizations',
	);
	const entries = bundle.entries.map((entry) => entry.object);

	return {
		...bundle,
		entries,
	};
};

export { loadBaseFieldLocalizationsBundleByBaseFieldId };
