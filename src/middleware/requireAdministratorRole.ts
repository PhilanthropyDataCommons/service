import { Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';
import type { AuthenticatedRequest } from '../types';

const requireAdministratorRole = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) => {
	if (req.role?.isAdministrator !== true) {
		next(
			new UnauthorizedError('Your account must have the administrator role.'),
		);
		return;
	}
	next();
};

export { requireAdministratorRole };
