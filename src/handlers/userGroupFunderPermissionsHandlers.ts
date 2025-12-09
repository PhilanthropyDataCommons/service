import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateUserGroupFunderPermission,
	removeUserGroupFunderPermission,
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
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const deleteUserGroupFunderPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const { keycloakOrganizationId, funderShortCode, permission } = coerceParams(
		req.params,
	);
	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid shortCode parameter.',
			isId.errors ?? [],
		);
	}
	if (!isPermission(permission)) {
		throw new InputValidationError(
			'Invalid permission parameter.',
			isPermission.errors ?? [],
		);
	}

	await removeUserGroupFunderPermission(
		db,
		null,
		keycloakOrganizationId,
		funderShortCode,
		permission,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const putUserGroupFunderPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { keycloakOrganizationId, funderShortCode, permission } = coerceParams(
		req.params,
	);

	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isShortCode(funderShortCode)) {
		throw new InputValidationError(
			'Invalid funderShortCode parameter.',
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
		await createOrUpdateUserGroupFunderPermission(db, req, {
			keycloakOrganizationId,
			funderShortCode,
			permission,
		});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userGroupFunderPermission);
};

const userGroupFunderPermissionsHandlers = {
	deleteUserGroupFunderPermission,
	putUserGroupFunderPermission,
};

export { userGroupFunderPermissionsHandlers };
