import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { AuthContext, CheckResult } from '../../../types';

export const assertProposalAuthorization = async (
	id: number,
	authContext: AuthContext,
): Promise<void> => {
	const authContextKeycloakUserId = authContext.user.keycloakUserId;
	const authContextIsAdministrator = authContext.role.isAdministrator;

	const result = await db.sql<CheckResult>('proposals.checkAuthorization', {
		authContextIsAdministrator,
		authContextKeycloakUserId,
		id,
	});

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Proposal',
			entityId: id,
		});
	}
};
