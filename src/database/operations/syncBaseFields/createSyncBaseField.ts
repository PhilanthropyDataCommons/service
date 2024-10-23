import { db } from '../../db';
import type {
	JsonResultSet,
	SyncBaseField,
	InternallyWritableSyncBaseField,
} from '../../../types';

export const createSyncBaseField = async (
	createValues: InternallyWritableSyncBaseField,
): Promise<SyncBaseField> => {
	const { synchronizationUrl, statusUpdatedAt, status, createdBy } =
		createValues;

	const result = await db.sql<JsonResultSet<SyncBaseField>>(
		'syncBaseFields.insertOne',
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
