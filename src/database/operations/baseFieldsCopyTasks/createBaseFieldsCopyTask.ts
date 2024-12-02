import { db } from '../../db';
import type {
	JsonResultSet,
	BaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
} from '../../../types';

export const createBaseFieldsCopyTask = async (
	createValues: InternallyWritableBaseFieldsCopyTask,
): Promise<BaseFieldsCopyTask> => {
	const { synchronizationUrl, statusUpdatedAt, status, createdBy } =
		createValues;

	const result = await db.sql<JsonResultSet<BaseFieldsCopyTask>>(
		'baseFieldsCopyTasks.insertOne',
		{
			status,
			statusUpdatedAt,
			synchronizationUrl,
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
