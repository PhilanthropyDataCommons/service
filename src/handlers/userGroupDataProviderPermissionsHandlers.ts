import { HTTP_STATUS } from '../constants';
import {
	db,
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
): Promise<void> => {
	const {
		params: { keycloakOrganizationId, dataProviderShortCode, permission },
	} = req;
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

	await removeUserGroupDataProviderPermission(
		db,
		null,
		keycloakOrganizationId,
		dataProviderShortCode,
		permission,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const putUserGroupDataProviderPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const {
		params: { keycloakOrganizationId, dataProviderShortCode, permission },
	} = req;

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
		await createOrUpdateUserGroupDataProviderPermission(db, req, {
			keycloakOrganizationId,
			dataProviderShortCode,
			permission,
		});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userGroupFunderPermission);
};

const userGroupDataProviderPermissionsHandlers = {
	deleteUserGroupDataProviderPermission,
	putUserGroupDataProviderPermission,
};

export { userGroupDataProviderPermissionsHandlers };
