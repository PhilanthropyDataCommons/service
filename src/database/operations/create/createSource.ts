import { db } from '../../db';
import type { Source, JsonResultSet, WritableSource } from '../../../types';

export const createSource = async (
	createValues: WritableSource,
): Promise<Source> => {
	const { label } = createValues;
	const dataProviderShortCode =
		'dataProviderShortCode' in createValues
			? createValues.dataProviderShortCode
			: undefined;
	const funderShortCode =
		'funderShortCode' in createValues
			? createValues.funderShortCode
			: undefined;
	const organizationId =
		'organizationId' in createValues ? createValues.organizationId : undefined;

	const result = await db.sql<JsonResultSet<Source>>('sources.insertOne', {
		label,
		dataProviderShortCode,
		funderShortCode,
		organizationId,
	});

	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};
