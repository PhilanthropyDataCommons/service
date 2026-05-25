import { generateLoadBundleOperation } from '../generators';
import type { Opportunity, ShortCode } from '../../../types';

const loadOpportunityBundle = generateLoadBundleOperation<
	Opportunity,
	[funderShortCode: ShortCode | undefined]
>('opportunities.selectWithPagination', ['funderShortCode']);

export { loadOpportunityBundle };
