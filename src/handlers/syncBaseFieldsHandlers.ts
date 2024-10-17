import {
	createSyncBaseField,
	loadSyncBaseFieldBundle,
	getLimitValues,
} from '../database';
import {
	SyncBasefieldStatus,
	isAuthContext,
	isTinyPgErrorWithQueryContext,
	isWritableSyncBaseField,
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
import { addSyncBaseFieldJob } from '../jobQueue';
import type { Request, Response, NextFunction } from 'express';

const postSyncBaseField = (req: Request, res: Response, next: NextFunction) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	if (!isWritableSyncBaseField(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableSyncBaseField.errors ?? [],
		);
	}

	const { synchronizationUrl } = req.body;
	const createdBy = req.user.keycloakUserId;
	(async () => {
		const syncBaseField = await createSyncBaseField({
			synchronizationUrl,
			status: SyncBasefieldStatus.PENDING,
			statusUpdatedAt: new Date().toISOString(),
			createdBy,
		});

		await addSyncBaseFieldJob({
			syncBaseFieldId: syncBaseField.id,
		});

		res.status(201).contentType('application/json').send(syncBaseField);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating sync BaseField.', error));
		} else {
			next(error);
		}
	});
};

const getSyncBaseFields = (
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
		const syncBaseFieldBundle = await loadSyncBaseFieldBundle(
			req,
			createdBy,
			limit,
			offset,
		);

		res.status(200).contentType('application/json').send(syncBaseFieldBundle);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error retrieving bulk uploads.', error));
			return;
		}
		next(error);
	});
};

export const syncBaseFieldHandlers = {
	postSyncBaseField,
	getSyncBaseFields,
};
