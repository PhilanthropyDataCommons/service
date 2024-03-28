import { loadBundle } from './loadBundle';
import type { Bundle, ApplicationFormField } from '../../../types';

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
	const bundle = await loadBundle<ApplicationFormField>(
		'applicationFormFields.selectWithPagination',
		{
			...defaultQueryParameters,
			...queryParameters,
		},
		'application_form_fields',
	);
	return bundle;
};
