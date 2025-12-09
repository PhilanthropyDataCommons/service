import { HTTP_STATUS } from '../constants';
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
	isWritableOpportunity,
	Permission,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	UnauthorizedError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import { authContextHasFunderPermission } from '../authorization';
import type { Request, Response } from 'express';

const getOpportunities = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const opportunityBundle = await loadOpportunityBundle(db, req, limit, offset);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(opportunityBundle);
};

const getOpportunity = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { opportunityId } = coerceParams(req.params);
	if (!isId(opportunityId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	const opportunity = await loadOpportunity(db, req, opportunityId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(opportunity);
};

const postOpportunity = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	if (!isWritableOpportunity(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableOpportunity.errors ?? [],
		);
	}
	if (
		!authContextHasFunderPermission(
			req,
			req.body.funderShortCode,
			Permission.EDIT,
		)
	) {
		throw new UnauthorizedError();
	}
	const opportunity = await createOpportunity(db, null, req.body);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(opportunity);
};

export const opportunitiesHandlers = {
	getOpportunities,
	getOpportunity,
	postOpportunity,
};
