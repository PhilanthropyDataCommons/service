import {
	getRealmAccessRolesFromRequest,
	getRealmManagementRolesFromRequest,
} from '../types';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';

const PDC_ADMIN_ROLE = 'pdc-admin';
const REALM_MANAGEMENT_ROLES_THAT_GRANT_VIEWING_ALL_USERS = [
	'query-users',
	'view-users',
	'manage-users',
];

const addRoleContext = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const authRoles = getRealmAccessRolesFromRequest(req);
	const realmManagementRoles = getRealmManagementRolesFromRequest(req);
	const canViewAllUsers =
		REALM_MANAGEMENT_ROLES_THAT_GRANT_VIEWING_ALL_USERS.some((role) =>
			realmManagementRoles.includes(role),
		);
	(req as AuthenticatedRequest).role = {
		isAdministrator: authRoles.includes(PDC_ADMIN_ROLE),
		canViewAllUsers,
	};
	next();
};

export { addRoleContext };
