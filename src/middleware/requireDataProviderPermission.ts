/**
 * Middleware to require a specific data provider permission for a request.
 *
 * @param {Permission} permission - The required permission to check for.
 * @returns {Function} Middleware function to validate the data provider permission.
 *
 * The middleware does the following:
 * 1. Ensures the request contains an AuthContext.
 * 2. Allows the request to proceed if the user is an administrator.
 * 3. Validates the `dataProviderShortCode` parameter in the request.
 * 4. Checks if the authenticated user has the required permission for the specified data provider.
 *
 * If any of the checks fail, the middleware will pass an appropriate error to the next middleware.
 */
import { Response, NextFunction } from 'express';
import { InputValidationError, UnauthorizedError } from '../errors';
import { isAuthContext, isShortCode } from '../types';
import type { Permission } from '../types';
import type { Request } from 'express';

const requireDataProviderPermission =
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
		const { dataProviderShortCode } = req.params;
		if (!isShortCode(dataProviderShortCode)) {
			next(
				new InputValidationError(
					'Invalid dataProviderShortCode.',
					isShortCode.errors ?? [],
				),
			);
			return;
		}
		const { user } = req;
		const permissions =
			user.permissions.dataProvider[dataProviderShortCode] ?? [];
		if (!permissions.includes(permission)) {
			next(
				new UnauthorizedError(
					'Authenticated user does not have permission to perform this action.',
				),
			);
			return;
		}
		next();
	};

export { requireDataProviderPermission };
