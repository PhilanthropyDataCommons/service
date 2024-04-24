import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { AuthContext, CheckResult } from '../../../types';

export const assertProposalAuthorization = async (
	id: number,
	authContext: AuthContext,
): Promise<void> => {
	const {
		user: { id: userId },
	} = authContext;
	const {
		role: { isAdministrator },
	} = authContext;

	const result = await db.sql<CheckResult>('proposals.checkAuthorization', {
		id,
		userId,
		isAdministrator,
	});

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`The proposal was not found (id: ${id})`);
	}
};
