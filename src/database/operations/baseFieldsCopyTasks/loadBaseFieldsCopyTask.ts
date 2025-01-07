import { generateLoadItemOperation } from '../generators';
import type { BaseFieldsCopyTask, Id } from '../../../types';

const loadBaseFieldsCopyTask = generateLoadItemOperation<
	BaseFieldsCopyTask,
	[baseFieldsCopyTaskId: Id]
>('baseFieldsCopyTasks.selectById', 'BaseFieldsCopyTask', [
	'baseFieldsCopyTaskId',
]);

export { loadBaseFieldsCopyTask };
