import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Source, WritableSource } from '../../../types';

const createSource = generateCreateOrUpdateItemOperation<
	Source,
	WritableSource,
	[]
>(
	'sources.insertOne',
	['label', 'dataProviderShortCode', 'funderShortCode', 'changemakerId'],
	[],
);

export { createSource };
