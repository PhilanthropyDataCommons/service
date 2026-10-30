import { HTTP_STATUS } from '../constants';
import {
	createUserSyncTask,
	getDatabase,
	getLimitValues,
	loadUserBundle,
	loadUserSyncTask,
} from '../database';
import { enqueueSyncUsersFromKeycloakJob } from '../jobQueue';
import { coerceParams } from '../coercion';
import { isAuthContext, isId, TaskStatus } from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import {
	extractKeycloakUserIdParameters,
	extractPaginationParameters,
} from '../queryParameters';
import type { Request, Response } from 'express';

const getUsers = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
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

const syncUsersFromKeycloak = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const keycloakAdminAuthorizationHeader: string | undefined =
		req.headers.authorization;
	if (keycloakAdminAuthorizationHeader === undefined) {
		throw new FailedMiddlewareError(
			"Missing Authorization header; the caller's credentials are passed through to Keycloak to perform the sync.",
		);
	}
	const db = getDatabase();
	const userSyncTask = await db.transaction(async (transactionDb) => {
		const task = await createUserSyncTask(transactionDb, req, {
			status: TaskStatus.PENDING,
		});
		await enqueueSyncUsersFromKeycloakJob(
			transactionDb,
			task.id,
			keycloakAdminAuthorizationHeader,
		);
		return task;
	});

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userSyncTask);
};

const getUserSyncTask = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { userSyncTaskId } = coerceParams(req.params);
	if (!isId(userSyncTaskId)) {
		throw new InputValidationError(
			'Invalid userSyncTaskId parameter.',
			isId.errors ?? [],
		);
	}
	const userSyncTask = await loadUserSyncTask(db, req, userSyncTaskId);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(userSyncTask);
};

const usersHandlers = {
	getUsers,
	syncUsersFromKeycloak,
	getUserSyncTask,
};

export { usersHandlers };
