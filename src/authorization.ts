import type {
	AuthContext,
	Id,
	OpportunityPermission,
	Permission,
	ShortCode,
} from './types';

const authContextHasChangemakerPermission = (
	auth: AuthContext,
	changemakerId: Id,
	permission: Permission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.changemaker[changemakerId] ?? []).includes(permission);

const authContextHasDataProviderPermission = (
	auth: AuthContext,
	dataProviderShortCode: ShortCode,
	permission: Permission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.dataProvider[dataProviderShortCode] ?? []).includes(
		permission,
	);

const authContextHasFunderPermission = (
	auth: AuthContext,
	funderShortCode: ShortCode,
	permission: Permission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.funder[funderShortCode] ?? []).includes(permission);

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
	authContextHasChangemakerPermission,
	authContextHasDataProviderPermission,
	authContextHasFunderPermission,
	authContextHasOpportunityPermission,
};
