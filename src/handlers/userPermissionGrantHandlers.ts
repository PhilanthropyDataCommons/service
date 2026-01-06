import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateUserPermissionGrant,
	getLimitValues,
	removeUserPermissionGrant,
	loadUserPermissionGrantBundle,
} from '../database';
import {
	isAuthContext,
	isKeycloakId,
	isPermissionVerb,
	isPermissionEntityType,
	isWritableUserPermissionGrant,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';
import type {
	KeycloakId,
	PermissionEntityType,
	PermissionVerb,
} from '../types';

interface ValidatedPermissionGrantParams {
	userKeycloakUserId: KeycloakId;
	entityType: PermissionEntityType;
	entityPk: string;
	permissionVerb: PermissionVerb;
}

const validatePermissionGrantParams = (
	req: Request,
): ValidatedPermissionGrantParams => {
	const { userKeycloakUserId, entityType, entityPk, permissionVerb } =
		coerceParams(req.params);

	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isPermissionEntityType(entityType)) {
		throw new InputValidationError(
			'Invalid entityType parameter.',
			isPermissionEntityType.errors ?? [],
		);
	}
	if (!isPermissionVerb(permissionVerb)) {
		throw new InputValidationError(
			'Invalid permissionVerb parameter.',
			isPermissionVerb.errors ?? [],
		);
	}
	if (entityPk === undefined) {
		throw new InputValidationError('Missing entityPk parameter.', []);
	}

	return {
		userKeycloakUserId,
		entityType,
		entityPk: String(entityPk),
		permissionVerb,
	};
};

const putUserPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { userKeycloakUserId, entityType, entityPk, permissionVerb } =
		validatePermissionGrantParams(req);

	const body = req.body as unknown;
	if (!isWritableUserPermissionGrant(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserPermissionGrant.errors ?? [],
		);
	}

	const { entities, notAfter } = body;
	const userPermissionGrant = await createOrUpdateUserPermissionGrant(db, req, {
		userKeycloakUserId,
		permissionVerb,
		rootEntityType: entityType,
		rootEntityPk: entityPk,
		entities,
		notAfter: notAfter ?? null,
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userPermissionGrant);
};

const deleteUserPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const { userKeycloakUserId, entityType, entityPk, permissionVerb } =
		validatePermissionGrantParams(req);

	await removeUserPermissionGrant(
		db,
		null,
		userKeycloakUserId,
		entityType,
		entityPk,
		permissionVerb,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const getUserPermissionGrants = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { userKeycloakUserId } = coerceParams(req.params);

	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
			isKeycloakId.errors ?? [],
		);
	}

	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const bundle = await loadUserPermissionGrantBundle(
		db,
		req,
		userKeycloakUserId,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const userPermissionGrantHandlers = {
	deleteUserPermissionGrant,
	getUserPermissionGrants,
	putUserPermissionGrant,
};

export { userPermissionGrantHandlers };
