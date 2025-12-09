import { HTTP_STATUS } from '../constants';
import {
	db,
	getLimitValues,
	createOrUpdateDataProvider,
	loadDataProviderBundle,
	loadDataProvider,
} from '../database';
import { isAuthContext, isWritableDataProvider } from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import { isShortCode } from '../types/ShortCode';
import type { Request, Response } from 'express';

const getDataProviders = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const dataProviderBundle = await loadDataProviderBundle(
		db,
		req,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(dataProviderBundle);
};

const getDataProvider = async (req: Request, res: Response): Promise<void> => {
	const { dataProviderShortCode } = coerceParams(req.params);
	if (!isShortCode(dataProviderShortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}
	const dataProvider = await loadDataProvider(db, null, dataProviderShortCode);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(dataProvider);
};

const putDataProvider = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { dataProviderShortCode: shortCode } = coerceParams(req.params);
	if (!isShortCode(shortCode)) {
		throw new InputValidationError(
			'Invalid short code.',
			isShortCode.errors ?? [],
		);
	}

	const body = req.body as unknown;
	if (!isWritableDataProvider(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableDataProvider.errors ?? [],
		);
	}
	const { name, keycloakOrganizationId } = body;
	const dataProvider = await createOrUpdateDataProvider(db, null, {
		shortCode,
		name,
		keycloakOrganizationId,
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(dataProvider);
};

export const dataProviderHandlers = {
	getDataProviders,
	getDataProvider,
	putDataProvider,
};
