import { loadBundle } from '../generic/loadBundle';
import type {
	Bundle,
	ApplicationFormField,
	JsonResultSet,
} from '../../../types';

export const loadApplicationFormFieldBundle = async (queryParameters: {
	offset?: number;
	limit?: number;
	applicationFormId?: number;
}): Promise<Bundle<ApplicationFormField>> => {
	const defaultQueryParameters = {
		applicationFormId: 0,
		offset: 0,
		limit: 0,
	};
	const bundle = await loadBundle<JsonResultSet<ApplicationFormField>>(
		'applicationFormFields.selectWithPagination',
		{
			...defaultQueryParameters,
			...queryParameters,
		},
		'application_form_fields',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
