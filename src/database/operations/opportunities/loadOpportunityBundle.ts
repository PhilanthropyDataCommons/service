import { generateLoadBundleOperation } from '../generators';
import type { Opportunity } from '../../../types';

const loadOpportunityBundle = generateLoadBundleOperation<Opportunity, []>(
	'opportunities.selectWithPagination',
	'opportunities',
	[],
);

export { loadOpportunityBundle };
