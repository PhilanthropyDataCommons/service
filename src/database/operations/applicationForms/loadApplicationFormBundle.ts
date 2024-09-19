import { loadBundle } from '../generic/loadBundle';
import type { JsonResultSet, Bundle, ApplicationForm } from '../../../types';

export const loadApplicationFormBundle = async (
	limit: number | undefined,
	offset: number,
): Promise<Bundle<ApplicationForm>> => {
	const bundle = await loadBundle<JsonResultSet<ApplicationForm>>(
		'applicationForms.selectWithPagination',
		{
			limit,
			offset,
		},
		'application_forms',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
