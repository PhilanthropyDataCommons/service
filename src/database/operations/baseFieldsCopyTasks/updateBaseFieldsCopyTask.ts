import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type {
	JsonResultSet,
	BaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
} from '../../../types';

export const updateBaseFieldsCopyTask = async (
	id: number,
	updateValues: Partial<InternallyWritableBaseFieldsCopyTask>,
): Promise<BaseFieldsCopyTask> => {
	const { statusUpdatedAt, status } = updateValues;
	const defaultValues = {
		fileSize: -1,
		statusUpdatedAt: '',
		status: '',
	};
	const result = await db.sql<JsonResultSet<BaseFieldsCopyTask>>(
		'baseFieldsCopyTasks.updateById',
		{
			...defaultValues,
			id,
			statusUpdatedAt,
			status,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'BaseFieldsCopyTask',
			entityId: id,
		});
	}
	return object;
};
