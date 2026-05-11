import { generateUpdateItemOperation } from '../generators';
import type {
	BaseFieldsCopyTask,
	Id,
	InternallyWritableBaseFieldsCopyTask,
} from '../../../types';

const updateBaseFieldsCopyTask = generateUpdateItemOperation<
	BaseFieldsCopyTask,
	Partial<InternallyWritableBaseFieldsCopyTask>,
	[baseFieldsCopyTaskId: Id]
>('baseFieldsCopyTasks.updateById', ['status'], ['baseFieldsCopyTaskId']);

export { updateBaseFieldsCopyTask };
