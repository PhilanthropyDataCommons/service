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
	const { status } = updateValues;

	const result = await db.sql<JsonResultSet<BaseFieldsCopyTask>>(
		'baseFieldsCopyTasks.updateById',
		{
			id,
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
