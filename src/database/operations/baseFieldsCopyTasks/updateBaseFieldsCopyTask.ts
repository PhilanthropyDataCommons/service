import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	BaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
} from '../../../types';

const updateBaseFieldsCopyTask = generateCreateOrUpdateItemOperation<
	BaseFieldsCopyTask,
	Partial<InternallyWritableBaseFieldsCopyTask>,
	[baseFieldsCopyTaskId: number]
>('baseFieldsCopyTasks.updateById', ['status'], ['baseFieldsCopyTaskId']);

export { updateBaseFieldsCopyTask };
