import { ForbiddenError } from '../errors';
import { getScopeFromRequest } from '../types';
import type { Request, Response, NextFunction } from 'express';

const KC_ADMIN_API_SCOPE = 'kc-admin-api';

const requireKeycloakAdminApiScope =
	() =>
	(req: Request, _res: Response, next: NextFunction): void => {
		const scope = getScopeFromRequest(req);
		const hasKcAdminApiScope =
			scope?.split(' ').includes(KC_ADMIN_API_SCOPE) ?? false;
		if (!hasKcAdminApiScope) {
			next(
				new ForbiddenError(
					'Your token must carry the kc-admin-api scope for the Keycloak Admin REST API to accept it.',
				),
			);
			return;
		}
		next();
	};

export { requireKeycloakAdminApiScope };
