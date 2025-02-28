import {
	db,
	createOpportunity,
	getLimitValues,
	loadOpportunity,
	loadOpportunityBundle,
} from '../database';
import {
	isAuthContext,
	isId,
	isTinyPgErrorWithQueryContext,
	isWritableOpportunity,
	Permission,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
	UnauthorizedError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { authContextHasFunderPermission } from '../authorization';
import type { Request, Response, NextFunction } from 'express';

const getOpportunities = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	loadOpportunityBundle(db, null, limit, offset)
		.then((opportunityBundle) => {
			res.status(200).contentType('application/json').send(opportunityBundle);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving opportunities.', error));
				return;
			}
			next(error);
		});
};

const getOpportunity = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const { opportunityId } = req.params;
	if (!isId(opportunityId)) {
		next(new InputValidationError('Invalid id parameter.', isId.errors ?? []));
		return;
	}
	loadOpportunity(db, req, opportunityId)
		.then((opportunity) => {
			res.status(200).contentType('application/json').send(opportunity);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving opportunity.', error));
				return;
			}
			next(error);
		});
};

const postOpportunity = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	if (!isWritableOpportunity(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableOpportunity.errors ?? [],
			),
		);
		return;
	}
	if (
		!authContextHasFunderPermission(
			req,
			req.body.funderShortCode,
			Permission.EDIT,
		)
	) {
		next(new UnauthorizedError());
		return;
	}
	createOpportunity(db, null, req.body)
		.then((opportunity) => {
			res.status(201).contentType('application/json').send(opportunity);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating opportunity.', error));
				return;
			}
			next(error);
		});
};

export const opportunitiesHandlers = {
	getOpportunities,
	getOpportunity,
	postOpportunity,
};
