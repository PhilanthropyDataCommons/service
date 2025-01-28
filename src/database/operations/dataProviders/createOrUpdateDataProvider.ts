import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	DataProvider,
	InternallyWritableDataProvider,
} from '../../../types';

const createOrUpdateDataProvider = generateCreateOrUpdateItemOperation<
	DataProvider,
	InternallyWritableDataProvider,
	[]
>(
	'dataProviders.insertOrUpdateOne',
	['shortCode', 'name', 'keycloakOrganizationId'],
	[],
);

export { createOrUpdateDataProvider };
