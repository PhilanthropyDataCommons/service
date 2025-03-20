import {
	db,
	assertUserFunderPermissionExists,
	createOrUpdateUserFunderPermission,
	removeUserFunderPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isShortCode,
	isWritableUserFunderPermission,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import type { Request, Response } from 'express';

const deleteUserFunderPermission = async (req: Request, res: Response) => {
	const { userKeycloakUserId, funderShortCode, permission } = req.params;
	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
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

	await assertUserFunderPermissionExists(
		userKeycloakUserId,
		funderShortCode,
		permission,
	);
	await removeUserFunderPermission(
		userKeycloakUserId,
		funderShortCode,
		permission,
	);
	res.status(204).contentType('application/json').send();
};

const putUserFunderPermission = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { userKeycloakUserId, funderShortCode, permission } = req.params;
	const createdBy = req.user.keycloakUserId;

	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
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
	if (!isWritableUserFunderPermission(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserFunderPermission.errors ?? [],
		);
	}

	const userFunderPermission = await createOrUpdateUserFunderPermission(
		db,
		null,
		{
			userKeycloakUserId,
			funderShortCode,
			permission,
			createdBy,
		},
	);
	res.status(201).contentType('application/json').send(userFunderPermission);
};

const userFunderPermissionsHandlers = {
	deleteUserFunderPermission,
	putUserFunderPermission,
};

export { userFunderPermissionsHandlers };
