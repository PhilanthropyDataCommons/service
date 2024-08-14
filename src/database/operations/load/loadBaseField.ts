import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, BaseField } from '../../../types';

export const loadBaseField = async (id: number): Promise<BaseField> => {
	const result = await db.sql<JsonResultSet<BaseField>>(
		'baseFields.selectById',
		{
			id,
		},
	);
	const baseField = result.rows[0]?.object;
	if (baseField === undefined) {
		throw new NotFoundError(`The base field was not found (id: ${id})`);
	}
	return baseField;
};
