import { HTTP_STATUS } from '../constants';
import {
	createInitiative,
	getDatabase,
	getLimitValues,
	loadChangemaker,
	loadInitiative,
	loadInitiativeBundle,
	updateInitiative,
} from '../database';
import {
	isAuthContext,
	isId,
	isInitiativePatch,
	isWritableInitiative,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	NoDataReturnedError,
	NotFoundError,
} from '../errors';
import {
	extractChangemakerParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const getInitiatives = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { changemakerId } = extractChangemakerParameters(req);
	const bundle = await loadInitiativeBundle(
		db,
		req,
		changemakerId,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const getInitiative = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { initiativeId } = coerceParams(req.params);
	if (!isId(initiativeId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	const initiative = await loadInitiative(db, req, initiativeId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(initiative);
};

const postInitiative = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const body = req.body as unknown;
	if (!isWritableInitiative(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableInitiative.errors ?? [],
		);
	}

	await loadChangemaker(db, req, body.changemakerId);

	const initiative = await createInitiative(db, req, body);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(initiative);
};

const patchInitiative = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { initiativeId } = coerceParams(req.params);
	if (!isId(initiativeId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	if (!isInitiativePatch(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isInitiativePatch.errors ?? [],
		);
	}

	try {
		const updatedInitiative = await updateInitiative(
			db,
			req,
			req.body,
			initiativeId,
		);
		res
			.status(HTTP_STATUS.SUCCESSFUL.OK)
			.contentType('application/json')
			.send(updatedInitiative);
	} catch (error: unknown) {
		if (error instanceof NoDataReturnedError) {
			throw new NotFoundError(
				'The given initiative was not found.',
				{
					entityType: 'Initiative',
					entityPrimaryKey: {
						initiativeId,
					},
				},
				{ cause: error },
			);
		}
		throw error;
	}
};

const initiativesHandlers = {
	getInitiatives,
	getInitiative,
	postInitiative,
	patchInitiative,
};

export { initiativesHandlers };
