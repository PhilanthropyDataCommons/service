import { db, getLimitValues, loadUserBundle } from '../database';
import { isAuthContext } from '../types';
import { FailedMiddlewareError } from '../errors';
import {
	extractKeycloakUserIdParameters,
	extractPaginationParameters,
} from '../queryParameters';
import type { Request, Response } from 'express';

const getUsers = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { keycloakUserId } = extractKeycloakUserIdParameters(req);

	const userBundle = await loadUserBundle(
		db,
		req,
		keycloakUserId,
		limit,
		offset,
	);

	res.status(200).contentType('application/json').send(userBundle);
};

const usersHandlers = {
	getUsers,
};

export { usersHandlers };
