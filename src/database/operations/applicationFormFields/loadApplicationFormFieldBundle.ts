import { loadBundle } from '../generic/loadBundle';
import type {
	Bundle,
	ApplicationFormField,
	JsonResultSet,
} from '../../../types';

export const loadApplicationFormFieldBundle = async (
	applicationFormId: number | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<ApplicationFormField>> => {
	const bundle = await loadBundle<JsonResultSet<ApplicationFormField>>(
		'applicationFormFields.selectWithPagination',
		{
			applicationFormId,
			limit,
			offset,
		},
		'application_form_fields',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
