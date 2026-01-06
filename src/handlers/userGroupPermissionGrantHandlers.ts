import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateUserGroupPermissionGrant,
	getLimitValues,
	removeUserGroupPermissionGrant,
	loadUserGroupPermissionGrantBundle,
} from '../database';
import {
	isAuthContext,
	isKeycloakId,
	isPermissionVerb,
	isPermissionEntityType,
	isWritableUserGroupPermissionGrant,
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

interface ValidatedUserGroupPermissionGrantParams {
	keycloakOrganizationId: KeycloakId;
	entityType: PermissionEntityType;
	entityPk: string;
	permissionVerb: PermissionVerb;
}

const validateUserGroupPermissionGrantParams = (
	req: Request,
): ValidatedUserGroupPermissionGrantParams => {
	const { keycloakOrganizationId, entityType, entityPk, permissionVerb } =
		coerceParams(req.params);

	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
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
		keycloakOrganizationId,
		entityType,
		entityPk: String(entityPk),
		permissionVerb,
	};
};

const putUserGroupPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { keycloakOrganizationId, entityType, entityPk, permissionVerb } =
		validateUserGroupPermissionGrantParams(req);

	const body = req.body as unknown;
	if (!isWritableUserGroupPermissionGrant(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserGroupPermissionGrant.errors ?? [],
		);
	}

	const { entities, notAfter } = body;
	const userGroupPermissionGrant = await createOrUpdateUserGroupPermissionGrant(
		db,
		req,
		{
			keycloakOrganizationId,
			permissionVerb,
			rootEntityType: entityType,
			rootEntityPk: entityPk,
			entities,
			notAfter: notAfter ?? null,
		},
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userGroupPermissionGrant);
};

const deleteUserGroupPermissionGrant = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const { keycloakOrganizationId, entityType, entityPk, permissionVerb } =
		validateUserGroupPermissionGrantParams(req);

	await removeUserGroupPermissionGrant(
		db,
		null,
		keycloakOrganizationId,
		entityType,
		entityPk,
		permissionVerb,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const getUserGroupPermissionGrants = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { keycloakOrganizationId } = coerceParams(req.params);

	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
			isKeycloakId.errors ?? [],
		);
	}

	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const bundle = await loadUserGroupPermissionGrantBundle(
		db,
		req,
		keycloakOrganizationId,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const userGroupPermissionGrantHandlers = {
	deleteUserGroupPermissionGrant,
	getUserGroupPermissionGrants,
	putUserGroupPermissionGrant,
};

export { userGroupPermissionGrantHandlers };
