import { Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';
import type { AuthenticatedRequest } from '../types';

const requireAuthentication = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) => {
	if (req.auth === undefined) {
		next(new UnauthorizedError('No authorization token was found'));
		return;
	}
	next();
};

export { requireAuthentication };
