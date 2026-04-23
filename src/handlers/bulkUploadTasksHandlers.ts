import { HTTP_STATUS } from '../constants';
import {
	getDatabase,
	createBulkUploadTask,
	getLimitValues,
	hasOpportunityPermission,
	hasSourcePermission,
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
import type { AuthContext, Id } from '../types';
import type { TinyPg } from 'tinypg';

const validateApplicationFormCreatePermission = async (
	db: Pick<TinyPg, 'sql'>,
	authContext: AuthContext,
	applicationFormId: Id,
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
	db: Pick<TinyPg, 'sql'>,
	authContext: AuthContext,
	fileId: Id,
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
	const db = getDatabase();

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

	await validateApplicationFormCreatePermission(db, req, applicationFormId);

	if (
		!(await hasSourcePermission(db, req, {
			sourceId,
			permission: PermissionGrantVerb.REFERENCE,
			scope: PermissionGrantEntityType.SOURCE,
		}))
	) {
		throw new UnprocessableEntityError(
			'You do not have permission to reference the specified source.',
		);
	}

	await validateFileOwnership(
		db,
		req,
		proposalsDataFileId,
		'You must be the owner of the file specified by proposalsDataFileId.',
	);

	if (attachmentsArchiveFileId !== null) {
		await validateFileOwnership(
			db,
			req,
			attachmentsArchiveFileId,
			'You must be the owner of the file specified by attachmentsArchiveFileId.',
		);
	}

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
};

const getBulkUploadTasks = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
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
