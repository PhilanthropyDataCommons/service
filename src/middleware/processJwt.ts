import { expressjwt } from 'express-jwt';
import { jwtOptions } from '../auth/jwtOptions';
import { getLogger } from '../logger';
import type { NextFunction, Request, Response } from 'express';

const logger = getLogger(__filename);
const expressJwtMiddleware = expressjwt(jwtOptions);

const processJwt = (req: Request, res: Response, next: NextFunction): void => {
	let nextHasBeenCalled = false;

	const wrappedNext = (...args: unknown[]): unknown => {
		nextHasBeenCalled = true;
		return next(...args);
	};

	expressJwtMiddleware(req, res, wrappedNext).catch((err: unknown) => {
		logger.error(err);
		if (!nextHasBeenCalled) {
			next(err);
		}
	});
};

export { processJwt };
