import type { AuthContext, Permission, ShortCode } from './types';

const authContextHasFunderPermission = (
	auth: AuthContext,
	funderShortCode: ShortCode,
	permission: Permission,
): boolean =>
	auth.user.permissions.funder[funderShortCode] !== undefined &&
	auth.user.permissions.funder[funderShortCode].includes(permission);

export { authContextHasFunderPermission };
