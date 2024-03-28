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
		throw new NotFoundError(
			`The Application Form Field was not found (id: ${id})`,
		);
	}
	return object;
};
