import { v4 as uuidv4 } from 'uuid';
import { createOrUpdateFunder } from '../../database';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	Funder,
	InternallyWritableFunder,
} from '../../types';

const createTestFunder = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<InternallyWritableFunder>,
): Promise<Funder> => {
	const defaultValues: InternallyWritableFunder = {
		shortCode: `test_funder_${uuidv4()}`,
		name: 'Test Funder',
		keycloakOrganizationId: null,
		isCollaborative: false,
	};
	return await createOrUpdateFunder(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestFunder };
