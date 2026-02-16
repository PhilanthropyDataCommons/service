import { HTTP_STATUS } from '../constants';
import {
	createPermissionGrant,
	db,
	getLimitValues,
	loadPermissionGrant,
	loadPermissionGrantBundle,
	removePermissionGrant,
} from '../database';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { isAuthContext, isId, isWritablePermissionGrant } from '../types';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const getPermissionGrants = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { limit, offset } = getLimitValues(paginationParameters);

	const permissionGrantBundle = await loadPermissionGrantBundle(
		db,
		req,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(permissionGrantBundle);
};

const postPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritablePermissionGrant(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritablePermissionGrant.errors ?? [],
		);
	}

	if (body.conditions !== undefined && body.conditions !== null) {
		const scopeStrings = body.scope as string[];
		const invalidKeys = Object.keys(body.conditions).filter(
			(key) => !scopeStrings.includes(key),
		);
		const [firstInvalidKey] = invalidKeys;
		if (firstInvalidKey !== undefined) {
			throw new InputValidationError(
				`Condition keys must be present in the grant scope. Invalid keys: ${invalidKeys.join(', ')}`,
				[],
			);
		}
	}

	const permissionGrant = await createPermissionGrant(db, req, body);

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(permissionGrant);
};

const getPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { permissionGrantId } = coerceParams(req.params);
	if (!isId(permissionGrantId)) {
		throw new InputValidationError(
			'Invalid permissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	const permissionGrant = await loadPermissionGrant(db, req, permissionGrantId);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(permissionGrant);
};

const deletePermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { permissionGrantId } = coerceParams(req.params);
	if (!isId(permissionGrantId)) {
		throw new InputValidationError(
			'Invalid permissionGrantId parameter.',
			isId.errors ?? [],
		);
	}

	await removePermissionGrant(db, req, permissionGrantId);

	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const permissionGrantsHandlers = {
	deletePermissionGrant,
	getPermissionGrant,
	getPermissionGrants,
	postPermissionGrant,
};

export { permissionGrantsHandlers };
