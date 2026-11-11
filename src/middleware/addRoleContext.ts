import {
	getRealmAccessRolesFromRequest,
	getRealmManagementRolesFromRequest,
} from '../types';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';

const PDC_ADMIN_ROLE = 'pdc-admin';
const REALM_MANAGEMENT_ROLES_THAT_GRANT_VIEWING_USERS_IN_KEYCLOAK = [
	'query-users',
	'view-users',
	'manage-users',
];
const REALM_MANAGEMENT_ROLES_THAT_GRANT_VIEWING_ORGANIZATIONS_IN_KEYCLOAK = [
	'view-organizations',
	'manage-organizations',
	'manage-realm',
];

const addRoleContext = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const authRoles = getRealmAccessRolesFromRequest(req);
	const realmManagementRoles = getRealmManagementRolesFromRequest(req);
	const isAdministrator = authRoles.includes(PDC_ADMIN_ROLE);
	const canViewUsersInKeycloak =
		REALM_MANAGEMENT_ROLES_THAT_GRANT_VIEWING_USERS_IN_KEYCLOAK.some((role) =>
			realmManagementRoles.includes(role),
		);
	const canViewOrganizationsInKeycloak =
		REALM_MANAGEMENT_ROLES_THAT_GRANT_VIEWING_ORGANIZATIONS_IN_KEYCLOAK.some(
			(role) => realmManagementRoles.includes(role),
		);
	(req as AuthenticatedRequest).role = {
		isAdministrator,
		canViewUsersInKeycloak,
		canViewOrganizationsInKeycloak,
	};
	next();
};

export { addRoleContext };
