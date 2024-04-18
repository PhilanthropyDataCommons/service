import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { CheckResult } from '../../../types';

export const assertProposalAuthorization = async (
	id: number,
	userId: number,
): Promise<void> => {
	const result = await db.sql<CheckResult>('proposals.checkAuthorization', {
		id,
		userId,
	});

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`The proposal was not found (id: ${id})`);
	}
};
