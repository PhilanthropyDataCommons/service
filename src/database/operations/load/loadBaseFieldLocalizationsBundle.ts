import { loadBundle } from './loadBundle';
import type {
	Bundle,
	JsonResultSet,
	BaseFieldLocalization,
} from '../../../types';

export const loadBaseFieldLocalizationsBundle = async (queryParameters: {
	offset?: number;
	limit?: number;
	baseFieldId?: number;
}): Promise<Bundle<BaseFieldLocalization>> => {
	const defaultQueryParameters = {
		baseFieldId: 0,
		offset: 0,
		limit: 0,
	};
	const bundle = await loadBundle<JsonResultSet<BaseFieldLocalization>>(
		'baseFieldLocalizations.selectWithPagination',
		{
			...defaultQueryParameters,
			...queryParameters,
		},
		'base_field_localizations',
	);
	const entries = bundle.entries.map((entry) => entry.object);

	return {
		...bundle,
		entries,
	};
};
