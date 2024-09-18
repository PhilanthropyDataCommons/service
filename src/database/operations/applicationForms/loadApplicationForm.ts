import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, ApplicationForm } from '../../../types';

export const loadApplicationForm = async (
	id: number,
): Promise<ApplicationForm> => {
	const result = await db.sql<JsonResultSet<ApplicationForm>>(
		'applicationForms.selectById',
		{
			id,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'ApplicationForm',
			entityId: id,
		});
	}
	return object;
};
