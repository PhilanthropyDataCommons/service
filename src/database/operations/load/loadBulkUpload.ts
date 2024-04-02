import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, BulkUpload } from '../../../types';

export const loadBulkUpload = async (id: number): Promise<BulkUpload> => {
	const bulkUploadsQueryResult = await db.sql<JsonResultSet<BulkUpload>>(
		'bulkUploads.selectById',
		{
			id,
		},
	);
	const { object } = bulkUploadsQueryResult.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`The bulk upload was not found (id: ${id})`);
	}
	return object;
};
