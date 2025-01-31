/**
 * Middleware to require a specific changemaker permission for a request.
 *
 * @param {Permission} permission - The required permission to check for.
 * @returns {Function} Middleware function to validate the changemaker permission.
 *
 * The middleware does the following:
 * 1. Ensures the request contains an AuthContext.
 * 2. Allows the request to proceed if the user is an administrator.
 * 3. Validates the `changemakerId` parameter in the request.
 * 4. Checks if the authenticated user has the required permission for the specified changemaker.
 *
 * If any of the checks fail, the middleware will pass an appropriate error to the next middleware.
 */
import { Response, NextFunction } from 'express';
import { InputValidationError, UnauthorizedError } from '../errors';
import { isAuthContext, isShortCode, isKeycloakId } from '../types';
import { db, loadOrganizationDataProviderPermission } from '../database';
import type { Permission } from '../types';
import type { Request } from 'express';

const requireOrganizationDataProviderPermission =
	(permission: Permission) =>
	(req: Request, res: Response, next: NextFunction) => {
		if (!isAuthContext(req)) {
			next(new UnauthorizedError('The request lacks an AuthContext.'));
			return;
		}
		if (req.role?.isAdministrator === true) {
			next();
			return;
		}
		const { dataProviderShortCode, keycloakOrganizationId } = req.params;
		if (!isShortCode(dataProviderShortCode)) {
			next(
				new InputValidationError(
					'Invalid dataProviderShortCode.',
					isShortCode.errors ?? [],
				),
			);
			return;
		}
		if (!isKeycloakId(keycloakOrganizationId)) {
			next(
				new InputValidationError(
					'Invalid keycloakOrganizationId.',
					isKeycloakId.errors ?? [],
				),
			);
			return;
		}

		const { user } = req;
		const userpermissions =
			user.permissions.dataProvider[dataProviderShortCode] ?? [];

		if (!userpermissions.includes(permission)) {
			loadOrganizationDataProviderPermission(
				db,
				null,
				keycloakOrganizationId,
				dataProviderShortCode,
				permission,
			)
				.then(() => {
					next();
					return;
				})
				.catch(() => {
					next(
						new UnauthorizedError(
							'Authenticated user does not have permission to perform this action.',
						),
					);
					return;
				});
		}
		next();
	};

export { requireOrganizationDataProviderPermission };
