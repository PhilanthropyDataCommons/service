import { generateCreateItemOperation } from '../generators';
import type {
	ChangemakerFieldValueBatch,
	WritableChangemakerFieldValueBatch,
} from '../../../types';

const createChangemakerFieldValueBatch = generateCreateItemOperation<
	ChangemakerFieldValueBatch,
	WritableChangemakerFieldValueBatch,
	[]
>('changemakerFieldValueBatches.insertOne', ['sourceId', 'notes'], []);

export { createChangemakerFieldValueBatch };
