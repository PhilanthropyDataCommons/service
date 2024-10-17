import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type {
	JsonResultSet,
	SyncBaseField,
	InternallyWritableSyncBaseField,
} from '../../../types';

export const updateSyncBaseField = async (
	id: number,
	updateValues: Partial<InternallyWritableSyncBaseField>,
): Promise<SyncBaseField> => {
	const { statusUpdatedAt, status } = updateValues;
	const defaultValues = {
		fileSize: -1,
		statusUpdatedAt: '',
		status: '',
	};
	const result = await db.sql<JsonResultSet<SyncBaseField>>(
		'syncBaseFields.updateById',
		{
			...defaultValues,
			id,
			statusUpdatedAt,
			status,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'SyncBaseField',
			entityId: id,
		});
	}
	return object;
};
