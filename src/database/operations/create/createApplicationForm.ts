import { db } from '../../db';
import type {
	JsonResultSet,
	ApplicationForm,
	WritableApplicationForm,
} from '../../../types';

export const createApplicationForm = async (
	createValues: WritableApplicationForm,
): Promise<ApplicationForm> => {
	const { opportunityId } = createValues;
	const result = await db.sql<JsonResultSet<ApplicationForm>>(
		'applicationForms.insertOne',
		{
			opportunityId,
		},
	);
	const applicationForm = result.rows[0]?.object;
	if (applicationForm === undefined) {
		throw new Error(
			'The application form creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return applicationForm;
};
