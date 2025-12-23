import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	ChangemakerFieldValueBatch,
	WritableChangemakerFieldValueBatch,
} from '../../../types';

const createChangemakerFieldValueBatch = generateCreateOrUpdateItemOperation<
	ChangemakerFieldValueBatch,
	WritableChangemakerFieldValueBatch,
	[]
>('changemakerFieldValueBatches.insertOne', ['sourceId', 'notes'], []);

export { createChangemakerFieldValueBatch };
