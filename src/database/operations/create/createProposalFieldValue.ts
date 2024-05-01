import { db as defaultDb } from '../../db';
import type {
	ProposalFieldValue,
	InternallyWritableProposalFieldValue,
} from '../../../types';

const createProposalFieldValue = async (
	createValues: InternallyWritableProposalFieldValue,
	db = defaultDb,
): Promise<ProposalFieldValue> => {
	const {
		proposalVersionId,
		applicationFormFieldId,
		position,
		value,
		isValid,
	} = createValues;
	const result = await db.sql<ProposalFieldValue>(
		'proposalFieldValues.insertOne',
		{
			proposalVersionId,
			applicationFormFieldId,
			position,
			value,
			isValid,
		},
	);
	const object = result.rows[0];
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};

export { createProposalFieldValue };
