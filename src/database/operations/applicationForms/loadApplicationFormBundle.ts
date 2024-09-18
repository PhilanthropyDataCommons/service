import { loadBundle } from '../generic/loadBundle';
import type { JsonResultSet, Bundle, ApplicationForm } from '../../../types';

export const loadApplicationFormBundle = async (
	queryParameters: {
		offset?: number;
		limit?: number;
	} = {},
): Promise<Bundle<ApplicationForm>> => {
	const defaultQueryParameters = {
		offset: 0,
		limit: 0,
	};
	const bundle = await loadBundle<JsonResultSet<ApplicationForm>>(
		'applicationForms.selectWithPagination',
		{
			...defaultQueryParameters,
			...queryParameters,
		},
		'application_forms',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
