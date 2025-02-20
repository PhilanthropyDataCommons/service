import type { AuthContext, Id, Permission, ShortCode } from './types';

const authContextHasChangemakerPermission = (
	auth: AuthContext,
	changemakerId: Id,
	permission: Permission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.changemaker[changemakerId] !== undefined &&
		auth.user.permissions.changemaker[changemakerId].includes(permission));

const authContextHasDataProviderPermission = (
	auth: AuthContext,
	dataProviderShortCode: ShortCode,
	permission: Permission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.dataProvider[dataProviderShortCode] !== undefined &&
		auth.user.permissions.dataProvider[dataProviderShortCode].includes(
			permission,
		));

const authContextHasFunderPermission = (
	auth: AuthContext,
	funderShortCode: ShortCode,
	permission: Permission,
): boolean =>
	auth.role.isAdministrator ||
	(auth.user.permissions.funder[funderShortCode] !== undefined &&
		auth.user.permissions.funder[funderShortCode].includes(permission));

export {
	authContextHasChangemakerPermission,
	authContextHasDataProviderPermission,
	authContextHasFunderPermission,
};
