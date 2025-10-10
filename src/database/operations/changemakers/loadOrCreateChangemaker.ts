import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Changemaker, WritableChangemaker } from '../../../types';

const loadOrCreateChangemaker = generateCreateOrUpdateItemOperation<
	Changemaker,
	WritableChangemaker,
	[]
>(
	'changemakers.insertOrSelectOne',
	['taxId', 'name', 'keycloakOrganizationId'],
	[],
);

export { loadOrCreateChangemaker };
