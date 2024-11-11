import { db } from '../../db';
import type {
	JsonResultSet,
	BulkUploadTask,
	InternallyWritableBulkUploadTask,
} from '../../../types';

export const createBulkUploadTask = async (
	createValues: InternallyWritableBulkUploadTask,
): Promise<BulkUploadTask> => {
	const { sourceId, fileName, sourceKey, status, createdBy } = createValues;

	const result = await db.sql<JsonResultSet<BulkUploadTask>>(
		'bulkUploadTasks.insertOne',
		{
			sourceId,
			fileName,
			sourceKey,
			status,
			createdBy,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};
