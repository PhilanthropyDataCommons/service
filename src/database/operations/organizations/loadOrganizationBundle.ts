import { generateLoadBundleOperation } from '../generators';
import type { Organization } from '../../../types';

const loadOrganizationBundle = generateLoadBundleOperation<Organization, []>(
	'organizations.selectWithPagination',
	[],
);

export { loadOrganizationBundle };
