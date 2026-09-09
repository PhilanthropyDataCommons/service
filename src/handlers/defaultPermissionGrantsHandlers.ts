import { HTTP_STATUS } from '../constants';
import {
	createDefaultPermissionGrant,
	getDatabase,
	getLimitValues,
	loadDefaultPermissionGrant,
	loadDefaultPermissionGrantBundle,
	removeDefaultPermissionGrant,
	updateDefaultPermissionGrant,
} from '../database';
import {
	FailedMiddlewareError,
	InputValidationError,
	NoDataReturnedError,
	NotFoundError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import {
	isAuthContext,
	isId,
	isWritableDefaultPermissionGrant,
} from '../types';
import { coerceParams } from '../coercion';
import {
	assertPermissionGrantContextEntityTypeIsSupported,
	assertPermissionGrantHasValidConditions,
	assertPermissionGrantHasValidScope,
} from './assertions';
import type { Request, Response } from 'express';

const getDefaultPermissionGrants = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const paginationParameters = extractPaginationParameters(req);
	const { limit, offset } = getLimitValues(paginationParameters);

	const defaultPermissionGrantBundle = await loadDefaultPermissionGrantBundle(
		db,
		req,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(defaultPermissionGrantBundle);
};

const postDefaultPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();

	const body = req.body as unknown;
	if (!isWritableDefaultPermissionGrant(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableDefaultPermissionGrant.errors ?? [],
		);
	}

	assertPermissionGrantContextEntityTypeIsSupported(body);
	assertPermissionGrantHasValidScope(body);
	assertPermissionGrantHasValidConditions(body);

	const defaultPermissionGrant = await createDefaultPermissionGrant(
		db,
		req,
		body,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(defaultPermissionGrant);
};

const getDefaultPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { defaultPermissionGrantId } = coerceParams(req.params);
	if (!isId(defaultPermissionGrantId)) {
		throw new InputValidationError(
			'Invalid defaultPermissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	const defaultPermissionGrant = await loadDefaultPermissionGrant(
		db,
		req,
		defaultPermissionGrantId,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(defaultPermissionGrant);
};

const putDefaultPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { defaultPermissionGrantId } = coerceParams(req.params);
	if (!isId(defaultPermissionGrantId)) {
		throw new InputValidationError(
			'Invalid defaultPermissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	const body = req.body as unknown;
	if (!isWritableDefaultPermissionGrant(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableDefaultPermissionGrant.errors ?? [],
		);
	}

	assertPermissionGrantContextEntityTypeIsSupported(body);
	assertPermissionGrantHasValidScope(body);
	assertPermissionGrantHasValidConditions(body);

	try {
		const defaultPermissionGrant = await updateDefaultPermissionGrant(
			db,
			req,
			body,
			defaultPermissionGrantId,
		);
		res
			.status(HTTP_STATUS.SUCCESSFUL.OK)
			.contentType('application/json')
			.send(defaultPermissionGrant);
	} catch (error: unknown) {
		if (error instanceof NoDataReturnedError) {
			throw new NotFoundError(
				'The given default permission grant was not found.',
				{
					entityType: 'DefaultPermissionGrant',
					entityPrimaryKey: {
						defaultPermissionGrantId,
					},
				},
				{ cause: error },
			);
		}
		throw error;
	}
};

const deleteDefaultPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const { defaultPermissionGrantId } = coerceParams(req.params);
	if (!isId(defaultPermissionGrantId)) {
		throw new InputValidationError(
			'Invalid defaultPermissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	await removeDefaultPermissionGrant(db, req, defaultPermissionGrantId);

	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const defaultPermissionGrantsHandlers = {
	deleteDefaultPermissionGrant,
	getDefaultPermissionGrant,
	getDefaultPermissionGrants,
	postDefaultPermissionGrant,
	putDefaultPermissionGrant,
};

export { defaultPermissionGrantsHandlers };
