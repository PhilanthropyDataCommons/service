import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { ApplicationForm } from '../../../types';

export const loadApplicationForm = async (
	id: number,
): Promise<ApplicationForm> => {
	const result = await db.sql<ApplicationForm>('applicationForms.selectById', {
		id,
	});
	const object = result.rows[0];
	if (object === undefined) {
		throw new NotFoundError(`Application Form not found (id: ${id})`);
	}
	return object;
};
