import { generateCreateItemOperation } from '../generators';
import type {
	BaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
} from '../../../types';

const createBaseFieldsCopyTask = generateCreateItemOperation<
	BaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
	[]
>('baseFieldsCopyTasks.insertOne', ['status', 'pdcApiUrl'], []);

export { createBaseFieldsCopyTask };
