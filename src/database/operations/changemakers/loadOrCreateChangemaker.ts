import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Changemaker, WritableChangemaker } from '../../../types';

interface LoadOrCreateChangemakerResult {
	changemaker: Changemaker;
	wasInserted: boolean;
}

const loadOrCreateChangemaker = generateCreateOrUpdateItemOperation<
	LoadOrCreateChangemakerResult,
	WritableChangemaker,
	[]
>(
	'changemakers.insertOrSelectOne',
	['taxId', 'name', 'keycloakOrganizationId'],
	[],
);

export { loadOrCreateChangemaker };
export type { LoadOrCreateChangemakerResult };
