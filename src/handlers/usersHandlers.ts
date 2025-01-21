import { db, getLimitValues, loadUserBundle } from '../database';
import { isAuthContext, isTinyPgErrorWithQueryContext } from '../types';
import { DatabaseError, FailedMiddlewareError } from '../errors';
import {
	extractKeycloakUserIdParameters,
	extractPaginationParameters,
} from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const getUsers = (req: Request, res: Response, next: NextFunction): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { keycloakUserId } = extractKeycloakUserIdParameters(req);

	(async () => {
		const userBundle = await loadUserBundle(
			db,
			req,
			keycloakUserId,
			limit,
			offset,
		);

		res.status(200).contentType('application/json').send(userBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving users.', error));
			return;
		}
		next(error);
	});
};

const usersHandlers = {
	getUsers,
};

export { usersHandlers };
