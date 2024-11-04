import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, BulkUploadTask } from '../../../types';

export const loadBulkUploadTask = async (
	id: number,
): Promise<BulkUploadTask> => {
	const bulkUploadsQueryResult = await db.sql<JsonResultSet<BulkUploadTask>>(
		'bulkUploadTasks.selectById',
		{
			id,
		},
	);
	const { object } = bulkUploadsQueryResult.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'BulkUploadTask',
			entityId: id,
		});
	}
	return object;
};
