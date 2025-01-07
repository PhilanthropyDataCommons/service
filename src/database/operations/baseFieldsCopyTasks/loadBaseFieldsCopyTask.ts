import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, BaseFieldsCopyTask } from '../../../types';

export const loadBaseFieldsCopyTask = async (
	id: number,
): Promise<BaseFieldsCopyTask> => {
	const baseFieldsCopyTaskQueryResult = await db.sql<
		JsonResultSet<BaseFieldsCopyTask>
	>('baseFieldsCopyTasks.selectById', {
		id,
	});
	const { object } = baseFieldsCopyTaskQueryResult.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'BaseFieldsCopyTask',
			entityId: id,
		});
	}
	return object;
};
