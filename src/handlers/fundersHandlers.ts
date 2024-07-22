import {
	createOrUpdateFunder,
	getLimitValues,
	loadFunderBundle,
	loadFunder,
} from '../database';
import {
	AuthenticatedRequest,
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableFunder,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { isShortCode } from '../types/ShortCode';
import type { Response, NextFunction } from 'express';

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
		const { offset, limit } = getLimitValues(paginationParameters);
		const funderBundle = await loadFunderBundle(offset, limit);

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
	const { funderShortCode } = req.params;
	if (!isShortCode(funderShortCode)) {
		next(
			new InputValidationError('Invalid short code.', isShortCode.errors ?? []),
		);
		return;
	}
	loadFunder(funderShortCode)
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

const putFunder = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const shortCode = req.params.funderShortCode;
	if (!isShortCode(shortCode)) {
		next(
			new InputValidationError('Invalid short code.', isShortCode.errors ?? []),
		);
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
		const funder = await createOrUpdateFunder({
			shortCode,
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

export const fundersHandlers = {
	getFunders,
	getFunder,
	putFunder,
};
