import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type {
	BaseField,
	WritableBaseField,
	JsonResultSet,
} from '../../../types';

export const createOrUpdateBaseField = async (
	updateValues: WritableBaseField,
): Promise<BaseField> => {
	const { scope, dataType, shortCode, label, description } = updateValues;
	const result = await db.sql<JsonResultSet<BaseField>>(
		'baseFields.createOrUpdateByShortcode',
		{
			scope,
			dataType,
			shortCode,
			label,
			description,
		},
	);
	const baseField = result.rows[0]?.object;
	if (baseField === undefined) {
		throw new NotFoundError('BaseField could not be created or updated', {
			entityType: 'BaseField',
			lookupValues: {
				shortCode,
			},
		});
	}
	return baseField;
};
