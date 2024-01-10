import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { BulkUpload } from '../../../types';

export const loadBulkUpload = async (id: number): Promise<BulkUpload> => {
	const bulkUploadsQueryResult = await db.sql<BulkUpload>(
		'bulkUploads.selectById',
		{
			id,
		},
	);
	const bulkUpload = bulkUploadsQueryResult.rows[0];
	if (bulkUpload === undefined) {
		throw new NotFoundError(`The bulk upload was not found (id: ${id})`);
	}
	return bulkUpload;
};
