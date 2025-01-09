import { generateLoadItemOperation } from '../generators';
import type { Source } from '../../../types';

const loadSystemSource = generateLoadItemOperation<Source, []>(
	'sources.selectSystemSource',
	'Source',
	[],
);

export { loadSystemSource };
