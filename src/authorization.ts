import type { AuthContext, Id, OpportunityPermission } from './types';

const authContextHasOpportunityPermission = (
	auth: AuthContext,
	opportunityId: Id,
	opportunityPermission: OpportunityPermission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.opportunity[opportunityId] ?? []).includes(
		opportunityPermission,
	);

export { authContextHasOpportunityPermission };
