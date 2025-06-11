import { UnauthorizedError } from '../errors';
import { hasMeaningfulAuthSub, isAuthContext } from '../types';
import type { Request, Response, NextFunction } from 'express';

const requireAuthentication = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!('auth' in req)) {
		next(new UnauthorizedError('No authorization token was found.'));
		return;
	}
	if (!hasMeaningfulAuthSub(req)) {
		next(
			new UnauthorizedError(
				'The authentication token must have a non-empty value for `auth.sub`.',
			),
		);
		return;
	}
	if (!isAuthContext(req)) {
		next(new UnauthorizedError('The request lacks an AuthContext.'));
		return;
	}
	next();
};

export { requireAuthentication };
