import { generateLoadItemOperation } from '../generators';
import type { Opportunity } from '../../../types';

const loadSystemOpportunity = generateLoadItemOperation<Opportunity, []>(
	'opportunities.selectSystemOpportunity',
	'Opportunity',
	[],
);

export { loadSystemOpportunity };
