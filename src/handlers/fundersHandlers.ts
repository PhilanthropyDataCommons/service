import {
	createFunder,
	getLimitValues,
	loadFunderBundle,
	loadFunder,
} from '../database';
import {
	AuthenticatedRequest,
	isAuthContext,
	isId,
	isTinyPgErrorWithQueryContext,
	isWritableFunder,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import type { Response, NextFunction } from 'express';

const postFunder = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	if (!isWritableFunder(req.body)) {
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
		const funder = await createFunder({
			name,
		});
		res.status(201).contentType('application/json').send(funder);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating funder.', error));
			return;
		}
		next(error);
	});
};

const getFunders = (
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
		const funderBundle = await loadFunderBundle({
			...getLimitValues(paginationParameters),
		});

		res.status(200).contentType('application/json').send(funderBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving funders.', error));
			return;
		}
		next(error);
	});
};

const getFunder = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	const { funderId } = req.params;
	if (!isId(funderId)) {
		next(new InputValidationError('Invalid request body.', isId.errors ?? []));
		return;
	}
	loadFunder(funderId)
		.then((funder) => {
			res.status(200).contentType('application/json').send(funder);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving funder.', error));
				return;
			}
			next(error);
		});
};

export const fundersHandlers = {
	postFunder,
	getFunders,
	getFunder,
};
