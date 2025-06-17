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
import { InputValidationError, UnauthorizedError } from '../errors';
import { isAuthContext, isId } from '../types';
import type { Permission } from '../types';
import type { Request, Response, NextFunction } from 'express';

const requireChangemakerPermission =
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
		const { changemakerId } = req.params;
		if (!isId(changemakerId)) {
			next(
				new InputValidationError('Invalid changemakerId.', isId.errors ?? []),
			);
			return;
		}
		const { user } = req;
		const permissions = user.permissions.changemaker[changemakerId] ?? [];
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

export { requireChangemakerPermission };
