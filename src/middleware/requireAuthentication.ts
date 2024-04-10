import { Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';
import type { AuthenticatedRequest } from '../types';

const requireAuthentication = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) => {
	if (req.auth === undefined) {
		next(new UnauthorizedError('No authorization token was found.'));
		return;
	}
	if (req.auth?.sub === undefined || req.auth.sub === '') {
		next(new UnauthorizedError('The authentication token lacks `auth.sub`.'));
		return;
	}
	if (req.user === undefined) {
		next(new UnauthorizedError('The request lacks a user context.'));
		return;
	}
	next();
};

export { requireAuthentication };
