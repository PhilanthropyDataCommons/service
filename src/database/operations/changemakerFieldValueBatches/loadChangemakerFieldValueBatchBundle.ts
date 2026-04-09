import { generateLoadBundleOperation } from '../generators';
import type { ChangemakerFieldValueBatch } from '../../../types';

const loadChangemakerFieldValueBatchBundle = generateLoadBundleOperation<
	ChangemakerFieldValueBatch,
	[]
>('changemakerFieldValueBatches.selectWithPagination', []);

export { loadChangemakerFieldValueBatchBundle };
