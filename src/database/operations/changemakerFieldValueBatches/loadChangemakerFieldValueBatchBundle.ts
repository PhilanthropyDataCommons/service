import { generateLoadBundleOperation } from '../generators';
import type { ChangemakerFieldValueBatch } from '../../../types';

const loadChangemakerFieldValueBatchBundle = generateLoadBundleOperation<
	ChangemakerFieldValueBatch,
	[]
>(
	'changemakerFieldValueBatches.selectWithPagination',
	'changemaker_field_value_batches',
	[],
);

export { loadChangemakerFieldValueBatchBundle };
