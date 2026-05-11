import { generateCreateItemOperation } from '../generators';
import type { WritableOpportunity, Opportunity } from '../../../types';

const createOpportunity = generateCreateItemOperation<
	Opportunity,
	WritableOpportunity,
	[]
>('opportunities.insertOne', ['title', 'funderShortCode'], []);

export { createOpportunity };
