import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type {
	BaseField,
	JsonResultSet,
	WritableBaseField,
} from '../../../types';

export const createBaseField = async (
	createValues: WritableBaseField,
): Promise<BaseField> => {
	const { label, description, shortCode, dataType } = createValues;
	const result = await db.sql<JsonResultSet<BaseField>>(
		'baseFields.insertOne',
		{
			label,
			description,
			shortCode,
			dataType,
		},
	);
	const baseField = result.rows[0]?.object;
	if (baseField === undefined) {
		throw new NotFoundError('The base field could not be created.');
	}
	return baseField;
};
