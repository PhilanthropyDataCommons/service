import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type {
	JsonResultSet,
	BulkUpload,
	InternallyWritableBulkUpload,
} from '../../../types';

export const updateBulkUpload = async (
	id: number,
	updateValues: Partial<InternallyWritableBulkUpload>,
): Promise<BulkUpload> => {
	const { fileSize, sourceKey, status } = updateValues;
	const defaultValues = {
		fileSize: -1,
		sourceKey: '',
		status: '',
	};
	const result = await db.sql<JsonResultSet<BulkUpload>>(
		'bulkUploads.updateById',
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
			entityType: 'BulkUpload',
			entityId: id,
		});
	}
	return object;
};
