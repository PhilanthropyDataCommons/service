import { loadBundle } from './loadBundle';
import type { Bundle, Organization } from '../../../types';

export const loadOrganizationBundle = async (queryParameters: {
	offset: number;
	limit: number;
	proposalId?: number;
}): Promise<Bundle<Organization>> => {
	const defaultQueryParameters = {
		proposalId: 0,
	};
	return loadBundle(
		'organizations.selectWithPagination',
		{
			...defaultQueryParameters,
			...queryParameters,
		},
		'organizations',
	);
};
