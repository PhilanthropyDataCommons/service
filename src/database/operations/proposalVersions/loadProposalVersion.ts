import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { JsonResultSet, ProposalVersion } from '../../../types';

export const loadProposalVersion = async (
	id: number,
): Promise<ProposalVersion> => {
	const result = await db.sql<JsonResultSet<ProposalVersion>>(
		'proposalVersions.selectById',
		{
			id,
		},
	);
	const proposalVersion = result.rows[0]?.object;
	if (proposalVersion === undefined) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'ProposalVersion',
			entityId: id,
		});
	}
	return proposalVersion;
};
