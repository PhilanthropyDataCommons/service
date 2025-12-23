import { generateLoadItemOperation } from '../generators';
import type { ChangemakerFieldValueBatch, Id } from '../../../types';

const loadChangemakerFieldValueBatch = generateLoadItemOperation<
	ChangemakerFieldValueBatch,
	[batchId: Id]
>('changemakerFieldValueBatches.selectById', 'ChangemakerFieldValueBatch', [
	'batchId',
]);

export { loadChangemakerFieldValueBatch };
