import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateFunder,
	getLimitValues,
	loadFunderBundle,
	loadFunder,
} from '../database';
import { isAuthContext, isWritableFunder } from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import { isShortCode } from '../types/ShortCode';
import type { Request, Response } from 'express';

const getFunders = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderBundle = await loadFunderBundle(db, req, limit, offset);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funderBundle);
};

const getFunder = async (req: Request, res: Response): Promise<void> => {
	const { funderShortCode } = coerceParams(req.params);
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}
	const funder = await loadFunder(db, null, funderShortCode);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(funder);
};

const putFunder = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { funderShortCode: shortCode } = coerceParams(req.params);
	if (!isShortCode(shortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}

	const body = req.body as unknown;
	if (!isWritableFunder(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableFunder.errors ?? [],
		);
	}

	const { name, keycloakOrganizationId, isCollaborative } = body;
	const funder = await createOrUpdateFunder(db, null, {
		shortCode,
		name,
		keycloakOrganizationId,
		isCollaborative,
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(funder);
};

export const fundersHandlers = {
	getFunders,
	getFunder,
	putFunder,
};
