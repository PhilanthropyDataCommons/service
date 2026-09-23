import { ForbiddenError } from '../errors';
import { getRealmManagementRolesFromRequest } from '../types';
import type { Request, Response, NextFunction } from 'express';

const requireKeycloakRealmManagementRoles =
	(...requiredManagementRoleSets: string[][]) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		const realmManagementRoles = getRealmManagementRolesFromRequest(req);
		const isAuthorized = requiredManagementRoleSets.every((requiredRoles) =>
			requiredRoles.some((role) => realmManagementRoles.includes(role)),
		);
		if (!isAuthorized) {
			next(
				new ForbiddenError(
					'Your account must hold at least one of the required Keycloak realm-management roles.',
				),
			);
			return;
		}
		next();
	};

export { requireKeycloakRealmManagementRoles };
