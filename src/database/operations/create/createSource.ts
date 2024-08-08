import { db } from '../../db';
import type { Source, JsonResultSet, WritableSource } from '../../../types';

export const createSource = async (
	createValues: WritableSource,
): Promise<Source> => {
	const { sourceType, label, relatedEntityId } = createValues;

	const result = await db.sql<JsonResultSet<Source>>('sources.insertOne', {
		sourceType,
		label,
		relatedEntityId,
	});
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};
