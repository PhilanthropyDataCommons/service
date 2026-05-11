import { generateUpsertItemOperation } from '../generators';
import type {
	DataProvider,
	InternallyWritableDataProvider,
} from '../../../types';

const createOrUpdateDataProvider = generateUpsertItemOperation<
	DataProvider,
	InternallyWritableDataProvider,
	[]
>(
	'dataProviders.insertOrUpdateOne',
	['shortCode', 'name', 'keycloakOrganizationId'],
	[],
);

export { createOrUpdateDataProvider };
