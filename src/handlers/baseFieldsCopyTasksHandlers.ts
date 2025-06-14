import {
	db,
	createBaseFieldsCopyTask,
	loadBaseFieldsCopyTaskBundle,
	getLimitValues,
} from '../database';
import {
	TaskStatus,
	isAuthContext,
	isWritableBaseFieldsCopyTask,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import {
	extractCreatedByParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { addCopyBaseFieldsJob } from '../jobQueue';
import type { Request, Response } from 'express';

const postBaseFieldsCopyTask = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	if (!isWritableBaseFieldsCopyTask(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseFieldsCopyTask.errors ?? [],
		);
	}

	const { pdcApiUrl } = req.body;
	const baseFieldsCopyTask = await createBaseFieldsCopyTask(db, req, {
		pdcApiUrl,
		status: TaskStatus.PENDING,
	});

	await addCopyBaseFieldsJob({
		baseFieldsCopyTaskId: baseFieldsCopyTask.id,
	});

	res.status(201).contentType('application/json').send(baseFieldsCopyTask);
};

const getBaseFieldsCopyTasks = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { createdBy } = extractCreatedByParameters(req);
	const baseFieldsCopyTaskBundle = await loadBaseFieldsCopyTaskBundle(
		db,
		req,
		createdBy,
		limit,
		offset,
	);

	res
		.status(200)
		.contentType('application/json')
		.send(baseFieldsCopyTaskBundle);
};

export const baseFieldsCopyTasksHandlers = {
	postBaseFieldsCopyTask,
	getBaseFieldsCopyTasks,
};
