import { isOrganization } from '../../../types';
import { loadBundle } from './loadBundle';
import type { TinyPgParams } from 'tinypg';
import type { Bundle, Organization } from '../../../types';

export const loadOrganizationBundle = async (
	queryParameters: TinyPgParams,
): Promise<Bundle<Organization>> =>
	loadBundle(
		'organizations.selectWithPagination',
		queryParameters,
		'organizations',
		isOrganization,
	);
