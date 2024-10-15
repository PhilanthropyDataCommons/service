import { db } from '../../db';
import {
	JsonResultSet,
	type ChangemakerProposal,
	type WritableChangemakerProposal,
} from '../../../types';

export const createChangemakerProposal = async (
	createValues: WritableChangemakerProposal,
): Promise<ChangemakerProposal> => {
	const { changemakerId, proposalId } = createValues;
	const result = await db.sql<JsonResultSet<ChangemakerProposal>>(
		'changemakersProposals.insertOne',
		{
			changemakerId,
			proposalId,
		},
	);
	const changemakerProposal = result.rows[0]?.object;
	if (changemakerProposal === undefined) {
		throw new Error(
			'The changemaker-proposal creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return changemakerProposal;
};
