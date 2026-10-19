import { ForbiddenError, UnauthorizedError } from '../errors';
import { isAuthContext } from '../types';
import type { Request, Response, NextFunction } from 'express';

const requireAdministratorRole = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new UnauthorizedError('The request lacks an AuthContext.'));
		return;
	}
	if (!req.role.isAdministrator) {
		next(new ForbiddenError('Your account must have the administrator role.'));
		return;
	}
	next();
};

export { requireAdministratorRole };
