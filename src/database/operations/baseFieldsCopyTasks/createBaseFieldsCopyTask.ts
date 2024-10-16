import { db } from '../../db';
import type {
	JsonResultSet,
	BaseFieldsCopyTask,
	InternallyWritableBaseFieldsCopyTask,
} from '../../../types';

export const createBaseFieldsCopyTask = async (
	createValues: InternallyWritableBaseFieldsCopyTask,
): Promise<BaseFieldsCopyTask> => {
	const { pdcApiUrl, status, createdBy } = createValues;

	const result = await db.sql<JsonResultSet<BaseFieldsCopyTask>>(
		'baseFieldsCopyTasks.insertOne',
		{
			status,
			pdcApiUrl,
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
