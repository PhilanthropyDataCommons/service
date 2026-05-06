import { generateUpsertItemOperation } from '../generators';
import type { Changemaker, WritableChangemaker } from '../../../types';

const loadOrCreateChangemaker = generateUpsertItemOperation<
	Changemaker,
	WritableChangemaker,
	[]
>(
	'changemakers.insertOrSelectOne',
	['taxId', 'name', 'keycloakOrganizationId'],
	[],
);

export { loadOrCreateChangemaker };
