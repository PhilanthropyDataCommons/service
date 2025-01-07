import { generateLoadItemOperation } from '../generators';
import type { Funder, ShortCode } from '../../../types';

const loadFunder = generateLoadItemOperation<
	Funder,
	[funderShortCode: ShortCode]
>('funders.selectByShortCode', 'Funder', ['funderShortCode']);

export { loadFunder };
