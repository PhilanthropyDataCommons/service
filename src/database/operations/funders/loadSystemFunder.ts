import { generateLoadItemOperation } from '../generators';
import type { Funder } from '../../../types';

const loadSystemFunder = generateLoadItemOperation<Funder, []>(
	'funders.selectSystemFunder',
	'Funder',
	[],
);

export { loadSystemFunder };
