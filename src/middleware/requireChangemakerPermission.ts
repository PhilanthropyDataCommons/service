/**
 * Middleware to require a specific changemaker permission for a request.
 *
 * @param {PermissionGrantVerb} permission - The required permission to check for.
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
import { coerceParams } from '../coercion';
import { db } from '../database';
import { hasChangemakerPermission } from '../database/operations';
import { InputValidationError, UnauthorizedError } from '../errors';
import { isAuthContext, isId, PermissionGrantEntityType } from '../types';
import type { PermissionGrantVerb } from '../types';
import type { NextFunction, Request, Response } from 'express';

const requireChangemakerPermission =
	(permission: PermissionGrantVerb) =>
	async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			if (!isAuthContext(req)) {
				next(new UnauthorizedError('The request lacks an AuthContext.'));
				return;
			}
			if (req.role.isAdministrator) {
				next();
				return;
			}
			const { changemakerId } = coerceParams(req.params);
			if (!isId(changemakerId)) {
				next(
					new InputValidationError('Invalid changemakerId.', isId.errors ?? []),
				);
				return;
			}
			const hasPermission = await hasChangemakerPermission(db, req, {
				changemakerId,
				permission,
				scope: PermissionGrantEntityType.CHANGEMAKER,
			});
			if (!hasPermission) {
				next(
					new UnauthorizedError(
						'Authenticated user does not have permission to perform this action.',
					),
				);
				return;
			}
			next();
		} catch (error) {
			next(error);
		}
	};

export { requireChangemakerPermission };
