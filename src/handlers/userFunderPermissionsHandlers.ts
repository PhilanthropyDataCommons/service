import { HTTP_STATUS } from '../constants';
import {
	db,
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

const deleteUserFunderPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const {
		params: { userKeycloakUserId, funderShortCode, permission },
	} = req;
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

	await removeUserFunderPermission(
		db,
		null,
		userKeycloakUserId,
		funderShortCode,
		permission,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const putUserFunderPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const {
		params: { userKeycloakUserId, funderShortCode, permission },
	} = req;

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
		req,
		{
			userKeycloakUserId,
			funderShortCode,
			permission,
		},
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userFunderPermission);
};

const userFunderPermissionsHandlers = {
	deleteUserFunderPermission,
	putUserFunderPermission,
};

export { userFunderPermissionsHandlers };
