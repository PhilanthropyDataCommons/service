import {
	createBaseFieldsCopyTask,
	loadBaseFieldsCopyTaskBundle,
	getLimitValues,
} from '../database';
import {
	TaskStatus,
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableBaseFieldsCopyTask,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import {
	extractCreatedByParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { addCopyBaseFieldsJob } from '../jobQueue';
import type { Request, Response, NextFunction } from 'express';

const postBaseFieldsCopyTask = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	if (!isWritableBaseFieldsCopyTask(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseFieldsCopyTask.errors ?? [],
		);
	}

	const { pdcApiUrl } = req.body;
	const createdBy = req.user.keycloakUserId;
	(async () => {
		const baseFieldsCopyTask = await createBaseFieldsCopyTask(null, {
			pdcApiUrl,
			status: TaskStatus.PENDING,
			createdBy,
		});

		await addCopyBaseFieldsJob({
			baseFieldsCopyTaskId: baseFieldsCopyTask.id,
		});

		res.status(201).contentType('application/json').send(baseFieldsCopyTask);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating basefield copy task.', error));
		} else {
			next(error);
		}
	});
};

const getBaseFieldsCopyTasks = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { createdBy } = extractCreatedByParameters(req);
	(async () => {
		const baseFieldsCopyTaskBundle = await loadBaseFieldsCopyTaskBundle(
			req,
			createdBy,
			limit,
			offset,
		);

		res
			.status(200)
			.contentType('application/json')
			.send(baseFieldsCopyTaskBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving basefields copy tasks.', error));
			return;
		}
		next(error);
	});
};

export const baseFieldsCopyTasksHandlers = {
	postBaseFieldsCopyTask,
	getBaseFieldsCopyTasks,
};
