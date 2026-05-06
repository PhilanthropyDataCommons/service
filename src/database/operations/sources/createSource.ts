import { generateCreateItemOperation } from '../generators';
import type { Source, WritableSource } from '../../../types';

const createSource = generateCreateItemOperation<Source, WritableSource, []>(
	'sources.insertOne',
	['label', 'dataProviderShortCode', 'funderShortCode', 'changemakerId'],
	[],
);

export { createSource };
