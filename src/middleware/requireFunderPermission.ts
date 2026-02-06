/**
 * Middleware to require a specific funder permission for a request.
 *
 * @param {PermissionGrantVerb} permission - The required permission to check for.
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
import { db } from '../database';
import { hasFunderPermission } from '../database/operations';
import { InputValidationError, UnauthorizedError } from '../errors';
import {
	isAuthContext,
	isShortCode,
	PermissionGrantEntityType,
} from '../types';
import type { PermissionGrantVerb } from '../types';
import type { NextFunction, Request, Response } from 'express';

const requireFunderPermission =
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
			const {
				params: { funderShortCode },
			} = req;
			if (!isShortCode(funderShortCode)) {
				next(
					new InputValidationError(
						'Invalid funderShortCode.',
						isShortCode.errors ?? [],
					),
				);
				return;
			}
			const hasPermission = await hasFunderPermission(db, req, {
				funderShortCode,
				permission,
				scope: PermissionGrantEntityType.FUNDER,
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

export { requireFunderPermission };
