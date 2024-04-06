import { Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors';
import type { Request as JWTRequest } from 'express-jwt';

const requireAuthentication = (
	req: JWTRequest,
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
