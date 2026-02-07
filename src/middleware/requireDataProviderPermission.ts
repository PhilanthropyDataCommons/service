/**
 * Middleware to require a specific data provider permission for a request.
 *
 * @param {PermissionGrantVerb} permission - The required permission to check for.
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
import { db } from '../database';
import { hasDataProviderPermission } from '../database/operations';
import { InputValidationError, UnauthorizedError } from '../errors';
import {
	isAuthContext,
	isShortCode,
	PermissionGrantEntityType,
} from '../types';
import type { PermissionGrantVerb } from '../types';
import type { NextFunction, Request, Response } from 'express';

const requireDataProviderPermission =
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
				params: { dataProviderShortCode },
			} = req;
			if (!isShortCode(dataProviderShortCode)) {
				next(
					new InputValidationError(
						'Invalid dataProviderShortCode.',
						isShortCode.errors ?? [],
					),
				);
				return;
			}
			const hasPermission = await hasDataProviderPermission(db, req, {
				dataProviderShortCode,
				permission,
				scope: PermissionGrantEntityType.DATA_PROVIDER,
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

export { requireDataProviderPermission };
