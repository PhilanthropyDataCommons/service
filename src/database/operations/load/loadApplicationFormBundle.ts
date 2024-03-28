import { loadBundle } from './loadBundle';
import type { Bundle, ApplicationForm } from '../../../types';

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
	const bundle = await loadBundle<ApplicationForm>(
		'applicationForms.selectWithPagination',
		{
			...defaultQueryParameters,
			...queryParameters,
		},
		'application_forms',
	);
	return bundle;
};
