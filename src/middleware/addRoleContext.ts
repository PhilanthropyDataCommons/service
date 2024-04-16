import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import type { JwtPayload } from 'jsonwebtoken';

const PDC_ADMIN_ROLE = 'pdc-admin';

interface ObjectWithRolesArray {
	roles: unknown[];
}

const isObjectWithRolesArray = (obj: unknown): obj is ObjectWithRolesArray =>
	typeof obj === 'object' &&
	obj !== null &&
	'roles' in obj &&
	Array.isArray(obj.roles);

const isTokenWithRoles = (
	token: JwtPayload,
): token is JwtPayload & { realm_access: ObjectWithRolesArray } =>
	isObjectWithRolesArray(token.realm_access);

const getAuthRolesFromRequest = (req: AuthenticatedRequest): unknown[] => {
	if (req.auth === undefined || !isTokenWithRoles(req.auth)) {
		return [];
	}
	return req.auth.realm_access.roles;
};

const addRoleContext = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	const authRoles = getAuthRolesFromRequest(req);
	req.role = {
		isAdministrator: authRoles.includes(PDC_ADMIN_ROLE),
	};
	next();
};

export { addRoleContext };
