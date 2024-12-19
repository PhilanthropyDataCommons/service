import {
	getLimitValues,
	createOrUpdateDataProvider,
	loadDataProviderBundle,
	loadDataProvider,
} from '../database';
import {
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableDataProvider,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { isShortCode } from '../types/ShortCode';
import type { Request, Response, NextFunction } from 'express';

const getDataProviders = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	(async () => {
		const { offset, limit } = getLimitValues(paginationParameters);
		const bundle = await loadDataProviderBundle(limit, offset);

		res.status(200).contentType('application/json').send(bundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving items.', error));
			return;
		}
		next(error);
	});
};

const getDataProvider = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { dataProviderShortCode } = req.params;
	if (!isShortCode(dataProviderShortCode)) {
		next(
			new InputValidationError('Invalid short code.', isShortCode.errors ?? []),
		);
		return;
	}
	loadDataProvider(dataProviderShortCode)
		.then((item) => {
			res.status(200).contentType('application/json').send(item);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving item.', error));
				return;
			}
			next(error);
		});
};

const putDataProvider = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const shortCode = req.params.dataProviderShortCode;
	if (!isShortCode(shortCode)) {
		next(
			new InputValidationError('Invalid short code.', isShortCode.errors ?? []),
		);
		return;
	}
	if (!isWritableDataProvider(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableDataProvider.errors ?? [],
			),
		);
		return;
	}
	const { name, keycloakOrganizationId } = req.body;
	(async () => {
		const dataProvider = await createOrUpdateDataProvider({
			shortCode,
			name,
			keycloakOrganizationId,
		});
		res.status(201).contentType('application/json').send(dataProvider);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating item.', error));
			return;
		}
		next(error);
	});
};

export const dataProviderHandlers = {
	getDataProviders,
	getDataProvider,
	putDataProvider,
};
