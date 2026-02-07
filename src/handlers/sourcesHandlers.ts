import { HTTP_STATUS } from '../constants';
import {
	db,
	createSource,
	getLimitValues,
	hasChangemakerPermission,
	hasDataProviderPermission,
	hasFunderPermission,
	loadSource,
	loadSourceBundle,
	removeSource,
} from '../database';
import {
	isAuthContext,
	isId,
	isWritableSource,
	PermissionGrantEntityType,
	PermissionGrantVerb,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	UnprocessableEntityError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const postSource = async (req: Request, res: Response): Promise<void> => {
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
		!(await hasFunderPermission(db, req, {
			funderShortCode: req.body.funderShortCode,
			permission: PermissionGrantVerb.EDIT,
			scope: PermissionGrantEntityType.FUNDER,
		}))
	) {
		throw new UnprocessableEntityError(
			'You do not have write permissions on a funder with the specified short code.',
		);
	}
	if (
		'dataProviderShortCode' in req.body &&
		!(await hasDataProviderPermission(db, req, {
			dataProviderShortCode: req.body.dataProviderShortCode,
			permission: PermissionGrantVerb.EDIT,
			scope: PermissionGrantEntityType.DATA_PROVIDER,
		}))
	) {
		throw new UnprocessableEntityError(
			'You do not have write permissions on a data provider with the specified short code.',
		);
	}
	if (
		'changemakerId' in req.body &&
		!(await hasChangemakerPermission(db, req, {
			changemakerId: req.body.changemakerId,
			permission: PermissionGrantVerb.EDIT,
			scope: PermissionGrantEntityType.CHANGEMAKER,
		}))
	) {
		throw new UnprocessableEntityError(
			'You do not have write permissions on a changemaker with the specified id.',
		);
	}

	// Normally we try to avoid passing the body directly vs extracting the values and passing them.
	// Because because writableSource is a union type it is hard to extract the values directly without
	// losing type context that the union provided.
	const source = await createSource(db, null, req.body);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(source);
};

const getSources = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const bundle = await loadSourceBundle(db, req, limit, offset);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const getSource = async (req: Request, res: Response): Promise<void> => {
	const { sourceId } = coerceParams(req.params);
	if (!isId(sourceId)) {
		throw new InputValidationError('Invalid request body.', isId.errors ?? []);
	}
	const source = await loadSource(db, null, sourceId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(source);
};

const deleteSource = async (req: Request, res: Response): Promise<void> => {
	const { sourceId } = coerceParams(req.params);
	if (!isId(sourceId)) {
		throw new InputValidationError('Invalid request body.', isId.errors ?? []);
	}

	const item = await removeSource(db, null, sourceId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(item);
};

export const sourcesHandlers = {
	postSource,
	getSources,
	getSource,
	deleteSource,
};
