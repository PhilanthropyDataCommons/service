import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type {
	JsonResultSet,
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
} from '../../../types';

export const updateBulkUploadTask = async (
	id: number,
	updateValues: Partial<InternallyWritableBulkUploadTask>,
): Promise<BulkUploadTask> => {
	const { fileSize, sourceKey, status } = updateValues;
	const defaultValues = {
		fileSize: -1,
		sourceKey: '',
		status: '',
	};
	const result = await db.sql<JsonResultSet<BulkUploadTask>>(
		'bulkUploadTasks.updateById',
		{
			...defaultValues,
			id,
			fileSize,
			sourceKey,
			status,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'BulkUploadTask',
			entityId: id,
		});
	}
	return object;
};
