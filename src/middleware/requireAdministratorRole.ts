import { Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';
import { isAuthContext } from '../types';
import type { Request } from 'express';

const requireAdministratorRole = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!isAuthContext(req) || req.role?.isAdministrator !== true) {
		next(
			new UnauthorizedError('Your account must have the administrator role.'),
		);
		return;
	}
	next();
};

export { requireAdministratorRole };
