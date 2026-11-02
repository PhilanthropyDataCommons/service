import { HTTP_STATUS } from '../constants';
import {
	getDatabase,
	getLimitValues,
	loadOrganization,
	loadOrganizationBundle,
} from '../database';
import { isAuthContext, isId, isKeycloakId } from '../types';
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

export const organizationsHandlers = {
	getOrganization,
	getOrganizations,
};
