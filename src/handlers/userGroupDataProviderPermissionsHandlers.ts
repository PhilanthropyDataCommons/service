import {
	db,
	assertUserGroupDataProviderPermissionExists,
	createOrUpdateUserGroupDataProviderPermission,
	removeUserGroupDataProviderPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isShortCode,
	isWritableUserGroupFunderPermission,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import type { Request, Response } from 'express';

const deleteUserGroupDataProviderPermission = async (
	req: Request,
	res: Response,
) => {
	const { keycloakOrganizationId, dataProviderShortCode, permission } =
		req.params;
	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isShortCode(dataProviderShortCode)) {
		throw new InputValidationError(
			'Invalid dataProviderShortCode parameter.',
			isId.errors ?? [],
		);
	}
	if (!isPermission(permission)) {
		throw new InputValidationError(
			'Invalid permission parameter.',
			isPermission.errors ?? [],
		);
	}

	await assertUserGroupDataProviderPermissionExists(
		keycloakOrganizationId,
		dataProviderShortCode,
		permission,
	);
	await removeUserGroupDataProviderPermission(
		keycloakOrganizationId,
		dataProviderShortCode,
		permission,
	);
	res.status(204).contentType('application/json').send();
};

const putUserGroupDataProviderPermission = async (
	req: Request,
	res: Response,
) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { keycloakOrganizationId, dataProviderShortCode, permission } =
		req.params;
	const createdBy = req.user.keycloakUserId;

	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isShortCode(dataProviderShortCode)) {
		throw new InputValidationError(
			'Invalid dataProviderShortCode parameter.',
			isId.errors ?? [],
		);
	}
	if (!isPermission(permission)) {
		throw new InputValidationError(
			'Invalid permission parameter.',
			isPermission.errors ?? [],
		);
	}
	if (!isWritableUserGroupFunderPermission(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserGroupFunderPermission.errors ?? [],
		);
	}

	const userGroupFunderPermission =
		await createOrUpdateUserGroupDataProviderPermission(db, null, {
			keycloakOrganizationId,
			dataProviderShortCode,
			permission,
			createdBy,
		});
	res
		.status(201)
		.contentType('application/json')
		.send(userGroupFunderPermission);
};

const userGroupDataProviderPermissionsHandlers = {
	deleteUserGroupDataProviderPermission,
	putUserGroupDataProviderPermission,
};

export { userGroupDataProviderPermissionsHandlers };
