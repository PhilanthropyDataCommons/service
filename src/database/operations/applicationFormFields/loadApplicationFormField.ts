import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, ApplicationFormField } from '../../../types';

export const loadApplicationFormField = async (
	id: number,
): Promise<ApplicationFormField> => {
	const result = await db.sql<JsonResultSet<ApplicationFormField>>(
		'applicationFormFields.selectById',
		{
			id,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'ApplicationFormField',
			entityId: id,
		});
	}
	return object;
};
