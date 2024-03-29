import { db } from '../../db';
import type {
	JsonResultSet,
	BulkUpload,
	InternallyWritableBulkUpload,
} from '../../../types';

export const createBulkUpload = async (
	createValues: InternallyWritableBulkUpload,
): Promise<BulkUpload> => {
	const { fileName, sourceKey, status } = createValues;

	const result = await db.sql<JsonResultSet<BulkUpload>>(
		'bulkUploads.insertOne',
		{
			fileName,
			sourceKey,
			status,
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
