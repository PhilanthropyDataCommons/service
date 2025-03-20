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
import { isShortCode } from '../types/ShortCode';
import type { Request, Response } from 'express';

const getFunders = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const funderBundle = await loadFunderBundle(db, req, limit, offset);

	res.status(200).contentType('application/json').send(funderBundle);
};

const getFunder = async (req: Request, res: Response) => {
	const { funderShortCode } = req.params;
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}
	const funder = await loadFunder(db, null, funderShortCode);
	res.status(200).contentType('application/json').send(funder);
};

const putFunder = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const shortCode = req.params.funderShortCode;
	if (!isShortCode(shortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}
	if (!isWritableFunder(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableFunder.errors ?? [],
		);
	}
	const { name, keycloakOrganizationId } = req.body;

	const funder = await createOrUpdateFunder(db, null, {
		shortCode,
		name,
		keycloakOrganizationId,
	});
	res.status(201).contentType('application/json').send(funder);
};

export const fundersHandlers = {
	getFunders,
	getFunder,
	putFunder,
};
