import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	BaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
} from '../../../types';

const createBaseFieldsCopyTask = generateCreateOrUpdateItemOperation<
	BaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
	[]
>('baseFieldsCopyTasks.insertOne', ['status', 'pdcApiUrl'], []);

export { createBaseFieldsCopyTask };
