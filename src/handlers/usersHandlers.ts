import { HTTP_STATUS } from '../constants';
import { db, getLimitValues, loadUserBundle } from '../database';
import { isAuthContext } from '../types';
import { FailedMiddlewareError } from '../errors';
import {
	extractKeycloakUserIdParameters,
	extractPaginationParameters,
} from '../queryParameters';
import type { Request, Response } from 'express';

const getUsers = async (req: Request, res: Response): Promise<void> => {
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

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(userBundle);
};

const usersHandlers = {
	getUsers,
};

export { usersHandlers };
