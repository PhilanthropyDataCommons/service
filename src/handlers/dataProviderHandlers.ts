import {
	getLimitValues,
	createDataProvider,
	loadDataProviderBundle,
	loadDataProvider,
} from '../database';
import {
	AuthenticatedRequest,
	isAuthContext,
	isId,
	isTinyPgErrorWithQueryContext,
	isWritableDataProvider,
	isWritableFunder,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import type { Response, NextFunction } from 'express';

const postDataProvider = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	if (!isWritableDataProvider(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableFunder.errors ?? [],
			),
		);
		return;
	}

	const { name } = req.body;

	(async () => {
		const dataProvider = await createDataProvider({
			name,
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

const getDataProviders = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	(async () => {
		const bundle = await loadDataProviderBundle({
			...getLimitValues(paginationParameters),
		});

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
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	const { dataProviderId } = req.params;
	if (!isId(dataProviderId)) {
		next(new InputValidationError('Invalid request body.', isId.errors ?? []));
		return;
	}
	loadDataProvider(dataProviderId)
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

export const dataProviderHandlers = {
	postDataProvider,
	getDataProviders,
	getDataProvider,
};
