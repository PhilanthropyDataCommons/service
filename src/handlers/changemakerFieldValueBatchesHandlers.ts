import { HTTP_STATUS } from '../constants';
import {
	db,
	createChangemakerFieldValueBatch,
	getLimitValues,
	loadChangemakerFieldValueBatch,
	loadChangemakerFieldValueBatchBundle,
	loadSource,
} from '../database';
import {
	isAuthContext,
	isId,
	isWritableChangemakerFieldValueBatch,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	InputConflictError,
	NotFoundError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const postChangemakerFieldValueBatch = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritableChangemakerFieldValueBatch(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableChangemakerFieldValueBatch.errors ?? [],
		);
	}

	const { sourceId, notes } = body;

	// Verify source exists
	await loadSource(db, req, sourceId).catch((error: unknown) => {
		if (error instanceof NotFoundError) {
			throw new InputConflictError('The source does not exist.', {
				entityType: 'Source',
				entityId: sourceId,
			});
		}
		throw error;
	});

	const changemakerFieldValueBatch = await createChangemakerFieldValueBatch(
		db,
		req,
		{
			sourceId,
			notes,
		},
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(changemakerFieldValueBatch);
};

const getChangemakerFieldValueBatches = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const bundle = await loadChangemakerFieldValueBatchBundle(
		db,
		req,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const getChangemakerFieldValueBatch = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { batchId } = coerceParams(req.params);
	if (!isId(batchId)) {
		throw new InputValidationError(
			'Invalid batchId parameter.',
			isId.errors ?? [],
		);
	}
	const batch = await loadChangemakerFieldValueBatch(db, req, batchId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(batch);
};

export const changemakerFieldValueBatchesHandlers = {
	getChangemakerFieldValueBatch,
	getChangemakerFieldValueBatches,
	postChangemakerFieldValueBatch,
};
