import { HTTP_STATUS } from '../constants';
import {
	createTerminologySet,
	getDatabase,
	getLimitValues,
	loadTerminologySet,
	loadTerminologySetBundle,
	updateTerminologySet,
} from '../database';
import {
	isAuthContext,
	isId,
	isTerminologySetPatch,
	isWritableTerminologySet,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import {
	extractFunderParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const getTerminologySets = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { funderShortCode } = extractFunderParameters(req);
	const bundle = await loadTerminologySetBundle(
		db,
		req,
		funderShortCode,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const getTerminologySet = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { terminologySetId } = coerceParams(req.params);
	if (!isId(terminologySetId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	const terminologySet = await loadTerminologySet(db, req, terminologySetId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(terminologySet);
};

const postTerminologySet = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const body = req.body as unknown;
	if (!isWritableTerminologySet(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableTerminologySet.errors ?? [],
		);
	}
	const terminologySet = await createTerminologySet(db, req, body);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(terminologySet);
};

const patchTerminologySet = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { terminologySetId } = coerceParams(req.params);
	if (!isId(terminologySetId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	if (!isTerminologySetPatch(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isTerminologySetPatch.errors ?? [],
		);
	}

	await loadTerminologySet(db, req, terminologySetId);

	const updatedTerminologySet = await updateTerminologySet(
		db,
		null,
		req.body,
		terminologySetId,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(updatedTerminologySet);
};

export const terminologySetsHandlers = {
	getTerminologySets,
	getTerminologySet,
	postTerminologySet,
	patchTerminologySet,
};
