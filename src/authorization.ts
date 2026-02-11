import type {
	AuthContext,
	Id,
	OpportunityPermission,
	Permission,
	ShortCode,
} from './types';

const authContextHasDataProviderPermission = (
	auth: AuthContext,
	dataProviderShortCode: ShortCode,
	permission: Permission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.dataProvider[dataProviderShortCode] ?? []).includes(
		permission,
	);

const authContextHasOpportunityPermission = (
	auth: AuthContext,
	opportunityId: Id,
	opportunityPermission: OpportunityPermission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.opportunity[opportunityId] ?? []).includes(
		opportunityPermission,
	);

export {
	authContextHasDataProviderPermission,
	authContextHasOpportunityPermission,
};
