import { generateLoadBundleOperation } from '../generators';
import type { ShortCode, TerminologySet } from '../../../types';

const loadTerminologySetBundle = generateLoadBundleOperation<
	TerminologySet,
	[funderShortCode: ShortCode | undefined]
>('terminologySets.selectWithPagination', ['funderShortCode']);

export { loadTerminologySetBundle };
