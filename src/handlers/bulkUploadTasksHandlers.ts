import { HTTP_STATUS } from '../constants';
import {
	db,
	createBulkUploadTask,
	getLimitValues,
	hasOpportunityPermission,
	loadApplicationForm,
	loadBulkUploadTaskBundle,
	loadFileIfCreatedBy,
	loadOpportunity,
} from '../database';
import {
	PermissionGrantEntityType,
	PermissionGrantVerb,
	TaskStatus,
	isAuthContext,
	isWritableBulkUploadTask,
} from '../types';
import {
	FailedMiddlewareError,
	InputConflictError,
	InputValidationError,
	NotFoundError,
	UnprocessableEntityError,
} from '../errors';
import {
	extractCreatedByParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { addProcessBulkUploadJob } from '../jobQueue';
import type { Request, Response } from 'express';
import type { AuthContext } from '../types';

const validateApplicationFormCreatePermission = async (
	authContext: AuthContext,
	applicationFormId: number,
): Promise<void> => {
	try {
		const applicationForm = await loadApplicationForm(
			db,
			authContext,
			applicationFormId,
		);
		const opportunity = await loadOpportunity(
			db,
			authContext,
			applicationForm.opportunityId,
		);
		if (
			!(await hasOpportunityPermission(db, authContext, {
				opportunityId: opportunity.id,
				permission: PermissionGrantVerb.CREATE,
				scope: PermissionGrantEntityType.PROPOSAL,
			}))
		) {
			throw new UnprocessableEntityError(
				'You do not have permission to create proposals for this opportunity.',
			);
		}
	} catch (err: unknown) {
		if (err instanceof NotFoundError) {
			throw new UnprocessableEntityError(
				'You do not have permission to create proposals for this opportunity.',
			);
		}
		throw err;
	}
};

const validateFileOwnership = async (
	authContext: AuthContext,
	fileId: number,
	errorMessage: string,
): Promise<void> => {
	try {
		await loadFileIfCreatedBy(
			db,
			authContext,
			fileId,
			authContext.user.keycloakUserId,
		);
	} catch (err: unknown) {
		if (err instanceof NotFoundError) {
			throw new UnprocessableEntityError(errorMessage);
		}
		throw err;
	}
};

const postBulkUploadTask = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritableBulkUploadTask(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBulkUploadTask.errors ?? [],
		);
	}

	const {
		sourceId,
		applicationFormId,
		proposalsDataFileId,
		attachmentsArchiveFileId,
	} = body;

	await validateApplicationFormCreatePermission(req, applicationFormId);

	await validateFileOwnership(
		req,
		proposalsDataFileId,
		'You must be the owner of the file specified by proposalsDataFileId.',
	);

	if (attachmentsArchiveFileId !== null) {
		await validateFileOwnership(
			req,
			attachmentsArchiveFileId,
			'You must be the owner of the file specified by attachmentsArchiveFileId.',
		);
	}

	try {
		const bulkUploadTask = await createBulkUploadTask(db, req, {
			sourceId,
			applicationFormId,
			proposalsDataFileId,
			attachmentsArchiveFileId,
			status: TaskStatus.PENDING,
		});
		await addProcessBulkUploadJob({
			bulkUploadId: bulkUploadTask.id,
		});
		res
			.status(HTTP_STATUS.SUCCESSFUL.CREATED)
			.contentType('application/json')
			.send(bulkUploadTask);
	} catch (error: unknown) {
		if (error instanceof NotFoundError) {
			if (error.details.entityType === 'Source') {
				throw new InputConflictError(`The related entity does not exist`, {
					entityType: 'Source',
					entityId: sourceId,
				});
			}
		}
		throw error;
	}
};

const getBulkUploadTasks = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { createdBy } = extractCreatedByParameters(req);
	const bulkUploadTaskBundle = await loadBulkUploadTaskBundle(
		db,
		req,
		createdBy,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bulkUploadTaskBundle);
};

export const bulkUploadTasksHandlers = {
	postBulkUploadTask,
	getBulkUploadTasks,
};
