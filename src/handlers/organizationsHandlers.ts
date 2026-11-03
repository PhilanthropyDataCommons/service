import { HTTP_STATUS } from '../constants';
import {
	createOrganizationSyncTask,
	getDatabase,
	getLimitValues,
	loadOrganization,
	loadOrganizationBundle,
	loadOrganizationSyncTask,
} from '../database';
import { enqueueSyncOrganizationsFromKeycloakJob } from '../jobQueue';
import { isAuthContext, isId, isKeycloakId, TaskStatus } from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { coerceParams } from '../coercion';
import { extractPaginationParameters } from '../queryParameters';
import type { Request, Response } from 'express';

const getOrganizations = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const organizationBundle = await loadOrganizationBundle(
		db,
		req,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(organizationBundle);
};

const getOrganization = async (req: Request, res: Response): Promise<void> => {
	const { keycloakOrganizationId } = coerceParams(req.params);
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId.',
			isId.errors ?? [],
		);
	}
	const organization = await loadOrganization(db, req, keycloakOrganizationId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(organization);
};

const syncOrganizationsFromKeycloak = async (
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
	const organizationSyncTask = await db.transaction(async (transactionDb) => {
		const task = await createOrganizationSyncTask(transactionDb, req, {
			status: TaskStatus.PENDING,
		});
		await enqueueSyncOrganizationsFromKeycloakJob(
			transactionDb,
			task.id,
			keycloakAdminAuthorizationHeader,
		);
		return task;
	});

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(organizationSyncTask);
};

const getOrganizationSyncTask = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { organizationSyncTaskId } = coerceParams(req.params);
	if (!isId(organizationSyncTaskId)) {
		throw new InputValidationError(
			'Invalid organizationSyncTaskId parameter.',
			isId.errors ?? [],
		);
	}
	const organizationSyncTask = await loadOrganizationSyncTask(
		db,
		req,
		organizationSyncTaskId,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(organizationSyncTask);
};

export const organizationsHandlers = {
	getOrganization,
	getOrganizations,
	syncOrganizationsFromKeycloak,
	getOrganizationSyncTask,
};
