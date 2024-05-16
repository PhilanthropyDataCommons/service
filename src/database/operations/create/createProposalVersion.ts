import { db as defaultDb } from '../../db';
import type {
	JsonResultSet,
	ProposalVersion,
	WritableProposalVersion,
} from '../../../types';

const createProposalVersion = async (
	createValues: WritableProposalVersion,
	db = defaultDb,
): Promise<ProposalVersion> => {
	const { proposalId, applicationFormId } = createValues;
	const result = await db.sql<JsonResultSet<ProposalVersion>>(
		'proposalVersions.insertOne',
		{
			proposalId,
			applicationFormId,
		},
	);
	const { object } = result.rows[0] ?? {};
	if (object === undefined) {
		throw new Error(
			'The entity creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return object;
};

export { createProposalVersion };
