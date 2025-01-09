import { generateLoadItemOperation } from '../generators';
import type { Id, Opportunity } from '../../../types';

const loadOpportunity = generateLoadItemOperation<
	Opportunity,
	[opportunityId: Id]
>('opportunities.selectById', 'Opportunity', ['opportunityId']);

export { loadOpportunity };
