import { UnauthorizedError } from '../errors';
import { hasMeaningfulAuthSub, isAuthContext } from '../types';
import type { Request, Response, NextFunction } from 'express';
import { getLogger } from '../logger';

const logger = getLogger(__filename);

const requireAuthentication = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!('auth' in req)) {
		logger.error('No authorization token was found.');
		next(new UnauthorizedError('No authorization token was found.'));
		return;
	}
	if (!hasMeaningfulAuthSub(req)) {
		logger.error('The authentication token must have a non-empty value for `auth.sub`.');
		next(
			new UnauthorizedError(
				'The authentication token must have a non-empty value for `auth.sub`.',
			),
		);
		return;
	}
	if (!isAuthContext(req)) {
		logger.error('The request lacks an AuthContext.');
		next(new UnauthorizedError('The request lacks an AuthContext.'));
		return;
	}
	next();
};

export { requireAuthentication };
