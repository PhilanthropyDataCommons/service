import { HTTP_STATUS } from '../constants';
import { db, createChangemakerFieldValueBatch, loadSource } from '../database';
import { isAuthContext, isWritableChangemakerFieldValueBatch } from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	InputConflictError,
	NotFoundError,
} from '../errors';
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

export const changemakerFieldValueBatchesHandlers = {
	postChangemakerFieldValueBatch,
};
