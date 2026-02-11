import { v4 as uuidv4 } from 'uuid';
import { createOpportunity } from '../../database';
import { createTestFunder } from './createTestFunder';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	Opportunity,
	WritableOpportunity,
} from '../../types';

const createTestOpportunity = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<WritableOpportunity>,
): Promise<Opportunity> => {
	const funderShortCode =
		overrideValues?.funderShortCode ??
		(await createTestFunder(db, null)).shortCode;
	const defaultValues: WritableOpportunity = {
		title: `Test Opportunity ${uuidv4()}`,
		funderShortCode,
	};
	return await createOpportunity(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestOpportunity };
