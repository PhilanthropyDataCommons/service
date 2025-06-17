/**
 * Middleware to require a specific funder permission for a request.
 *
 * @param {Permission} permission - The required permission to check for.
 * @returns {Function} Middleware function to validate the funder permission.
 *
 * The middleware does the following:
 * 1. Ensures the request contains an AuthContext.
 * 2. Allows the request to proceed if the user is an administrator.
 * 3. Validates the `funderShortCode` parameter in the request.
 * 4. Checks if the authenticated user has the required permission for the specified funder.
 *
 * If any of the checks fail, the middleware will pass an appropriate error to the next middleware.
 */
import { InputValidationError, UnauthorizedError } from '../errors';
import { isAuthContext, isShortCode } from '../types';
import type { Permission } from '../types';
import type { Response, Request, NextFunction } from 'express';

const requireFunderPermission =
	(permission: Permission) =>
	(req: Request, res: Response, next: NextFunction) => {
		if (!isAuthContext(req)) {
			next(new UnauthorizedError('The request lacks an AuthContext.'));
			return;
		}
		if (req.role.isAdministrator) {
			next();
			return;
		}
		const { funderShortCode } = req.params;
		if (!isShortCode(funderShortCode)) {
			next(
				new InputValidationError(
					'Invalid funderShortCode.',
					isShortCode.errors ?? [],
				),
			);
			return;
		}
		const { user } = req;
		const permissions = user.permissions.funder[funderShortCode] ?? [];
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

export { requireFunderPermission };
