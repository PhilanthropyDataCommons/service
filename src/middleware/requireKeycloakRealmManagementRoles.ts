import { isEmpty } from '../arrays';
import { FailedMiddlewareError, ForbiddenError } from '../errors';
import { getRealmManagementRolesFromRequest } from '../types';
import type { Request, Response, NextFunction } from 'express';

const requireKeycloakRealmManagementRoles = (
	...requiredManagementRoleSets: string[][]
) => {
	if (isEmpty(requiredManagementRoleSets)) {
		throw new FailedMiddlewareError(
			'requireKeycloakRealmManagementRoles must be configured with at least one required role set; an empty configuration would admit every request (every([]) is true).',
		);
	}
	return (req: Request, _res: Response, next: NextFunction): void => {
		const realmManagementRoles = getRealmManagementRolesFromRequest(req);
		const isAuthorized = requiredManagementRoleSets.every((requiredRoles) =>
			requiredRoles.some((role) => realmManagementRoles.includes(role)),
		);
		if (!isAuthorized) {
			next(
				new ForbiddenError(
					'Your account must hold at least one of the Keycloak realm-management roles in each required set.',
				),
			);
			return;
		}
		next();
	};
};

export { requireKeycloakRealmManagementRoles };
