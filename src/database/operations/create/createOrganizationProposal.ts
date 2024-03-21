import { db } from '../../db';
import {
	JsonResultSet,
	type OrganizationProposal,
	type WritableOrganizationProposal,
} from '../../../types';

export const createOrganizationProposal = async (
	createValues: WritableOrganizationProposal,
): Promise<OrganizationProposal> => {
	const { organizationId, proposalId } = createValues;
	const result = await db.sql<JsonResultSet<OrganizationProposal>>(
		'organizationsProposals.insertOne',
		{
			organizationId,
			proposalId,
		},
	);
	const organizationProposal = result.rows[0]?.object;
	if (organizationProposal === undefined) {
		throw new Error(
			'The organization-proposal creation did not appear to fail, but no data was returned by the operation.',
		);
	}
	return organizationProposal;
};
