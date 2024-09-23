import { getRealmAccessRolesFromRequest } from '../types';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';

const PDC_ADMIN_ROLE = 'pdc-admin';

const addRoleContext = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const authRoles = getRealmAccessRolesFromRequest(req);
	(req as AuthenticatedRequest).role = {
		isAdministrator: authRoles.includes(PDC_ADMIN_ROLE),
	};
	next();
};

export { addRoleContext };
