import { v4 as uuidv4 } from 'uuid';
import { createChangemaker } from '../../database';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	Changemaker,
	WritableChangemaker,
} from '../../types';

const createTestChangemaker = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<WritableChangemaker>,
): Promise<Changemaker> => {
	const defaultValues: WritableChangemaker = {
		taxId: `test_changemaker_${uuidv4()}`,
		name: 'Test Changemaker',
		keycloakOrganizationId: null,
	};
	return await createChangemaker(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestChangemaker };
