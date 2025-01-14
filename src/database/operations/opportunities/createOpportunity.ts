import { generateCreateOrUpdateItemOperation } from '../generators';
import type { WritableOpportunity, Opportunity } from '../../../types';

const createOpportunity = generateCreateOrUpdateItemOperation<
	Opportunity,
	WritableOpportunity
>('opportunities.insertOne', ['title']);

export { createOpportunity };
