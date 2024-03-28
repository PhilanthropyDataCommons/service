import { db } from '../../db';
import type {
	ApplicationFormField,
	WritableApplicationFormField,
} from '../../../types';

const createApplicationFormField = async (
	createValues: WritableApplicationFormField,
): Promise<ApplicationFormField> => {
	const { applicationFormId, baseFieldId, position, label } = createValues;
	const result = await db.sql<ApplicationFormField>(
		'applicationFormFields.insertOne',
		{
			applicationFormId,
			baseFieldId,
			position,
			label,
		},
	);
	const applicationFormField = result.rows[0];
	if (applicationFormField === undefined) {
		throw new Error(
			'The application form field creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return applicationFormField;
};

export { createApplicationFormField };
