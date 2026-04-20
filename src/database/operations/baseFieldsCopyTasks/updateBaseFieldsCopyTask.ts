import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	BaseFieldsCopyTask,
	Id,
	InternallyWritableBaseFieldsCopyTask,
} from '../../../types';

const updateBaseFieldsCopyTask = generateCreateOrUpdateItemOperation<
	BaseFieldsCopyTask,
	Partial<InternallyWritableBaseFieldsCopyTask>,
	[baseFieldsCopyTaskId: Id]
>('baseFieldsCopyTasks.updateById', ['status'], ['baseFieldsCopyTaskId']);

export { updateBaseFieldsCopyTask };
