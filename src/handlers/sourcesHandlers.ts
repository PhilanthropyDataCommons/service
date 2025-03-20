import {
	db,
	createSource,
	getLimitValues,
	loadSource,
	loadSourceBundle,
} from '../database';
import { isAuthContext, isId, isWritableSource, Permission } from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	UnprocessableEntityError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import {
	authContextHasChangemakerPermission,
	authContextHasDataProviderPermission,
	authContextHasFunderPermission,
} from '../authorization';
import type { Request, Response } from 'express';

const postSource = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	if (!isWritableSource(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableSource.errors ?? [],
		);
	}
	if (
		'funderShortCode' in req.body &&
		!authContextHasFunderPermission(
			req,
			req.body.funderShortCode,
			Permission.EDIT,
		)
	) {
		throw new UnprocessableEntityError(
			'You do not have write permissions on a funder with the specified short code.',
		);
	}
	if (
		'dataProviderShortCode' in req.body &&
		!authContextHasDataProviderPermission(
			req,
			req.body.dataProviderShortCode,
			Permission.EDIT,
		)
	) {
		throw new UnprocessableEntityError(
			'You do not have write permissions on a data provider with the specified short code.',
		);
	}
	if (
		'changemakerId' in req.body &&
		!authContextHasChangemakerPermission(
			req,
			req.body.changemakerId,
			Permission.EDIT,
		)
	) {
		throw new UnprocessableEntityError(
			'You do not have write permissions on a changemaker with the specified id.',
		);
	}

	// Normally we try to avoid passing the body directly vs extracting the values and passing them.
	// Because because writableSource is a union type it is hard to extract the values directly without
	// losing type context that the union provided.
	const source = await createSource(db, null, req.body);
	res.status(201).contentType('application/json').send(source);
};

const getSources = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const bundle = await loadSourceBundle(db, req, limit, offset);

	res.status(200).contentType('application/json').send(bundle);
};

const getSource = async (req: Request, res: Response) => {
	const { sourceId } = req.params;
	if (!isId(sourceId)) {
		throw new InputValidationError('Invalid request body.', isId.errors ?? []);
	}
	const source = await loadSource(db, null, sourceId);
	res.status(200).contentType('application/json').send(source);
};

export const sourcesHandlers = {
	postSource,
	getSources,
	getSource,
};
