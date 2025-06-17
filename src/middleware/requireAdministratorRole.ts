import { UnauthorizedError } from '../errors';
import { isAuthContext } from '../types';
import type { Request, Response, NextFunction } from 'express';

const requireAdministratorRole = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req) || !req.role.isAdministrator) {
		next(
			new UnauthorizedError('Your account must have the administrator role.'),
		);
		return;
	}
	next();
};

export { requireAdministratorRole };
