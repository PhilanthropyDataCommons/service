import {
	createSource,
	getLimitValues,
	loadSource,
	loadSourceBundle,
} from '../database';
import {
	isAuthContext,
	isId,
	isTinyPgErrorWithQueryContext,
	isWritableSource,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const postSource = (req: Request, res: Response, next: NextFunction): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	if (!isWritableSource(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableSource.errors ?? [],
			),
		);
		return;
	}

	// Normally we try to avoid passing the body directly vs extracting the values and passing them.
	// Because because writableSource is a union type it is hard to extract the values directly without
	// losing type context that the union provided.
	createSource(req.body)
		.then((item) => {
			res.status(201).contentType('application/json').send(item);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating item.', error));
				return;
			}
			next(error);
		});
};

const getSources = (req: Request, res: Response, next: NextFunction): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	(async () => {
		const { offset, limit } = getLimitValues(paginationParameters);
		const bundle = await loadSourceBundle(req, limit, offset);

		res.status(200).contentType('application/json').send(bundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving items.', error));
			return;
		}
		next(error);
	});
};

const getSource = (req: Request, res: Response, next: NextFunction): void => {
	const { sourceId } = req.params;
	if (!isId(sourceId)) {
		next(new InputValidationError('Invalid request body.', isId.errors ?? []));
		return;
	}
	loadSource(sourceId)
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

export const sourcesHandlers = {
	postSource,
	getSources,
	getSource,
};
