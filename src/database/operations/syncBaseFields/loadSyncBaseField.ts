import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, SyncBaseField } from '../../../types';

export const loadSyncBaseField = async (id: number): Promise<SyncBaseField> => {
	const syncBaseFieldsQueryResult = await db.sql<JsonResultSet<SyncBaseField>>(
		'syncBaseFields.selectById',
		{
			id,
		},
	);
	const { object } = syncBaseFieldsQueryResult.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'SyncBaseField',
			entityId: id,
		});
	}
	return object;
};
