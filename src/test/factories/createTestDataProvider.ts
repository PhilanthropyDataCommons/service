import { v4 as uuidv4 } from 'uuid';
import { createOrUpdateDataProvider } from '../../database';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	DataProvider,
	InternallyWritableDataProvider,
} from '../../types';

const createTestDataProvider = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<InternallyWritableDataProvider>,
): Promise<DataProvider> => {
	const defaultValues: InternallyWritableDataProvider = {
		shortCode: `test_data_provider_${uuidv4()}`,
		name: 'Test Data Provider',
		keycloakOrganizationId: null,
	};
	const { item } = await createOrUpdateDataProvider(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
	return item;
};

export { createTestDataProvider };
