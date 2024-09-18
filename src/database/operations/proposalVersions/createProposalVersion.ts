import { db as defaultDb } from '../../db';
import type {
	JsonResultSet,
	ProposalVersion,
	InternallyWritableProposalVersion,
} from '../../../types';

const createProposalVersion = async (
	createValues: InternallyWritableProposalVersion,
	db = defaultDb,
): Promise<ProposalVersion> => {
	const { proposalId, applicationFormId, sourceId } = createValues;
	const result = await db.sql<JsonResultSet<ProposalVersion>>(
		'proposalVersions.insertOne',
		{
			proposalId,
			applicationFormId,
			sourceId,
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
