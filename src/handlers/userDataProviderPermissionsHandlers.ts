import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateUserDataProviderPermission,
	removeUserDataProviderPermission,
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

const deleteUserDataProviderPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const {
		params: { userKeycloakUserId, dataProviderShortCode, permission },
	} = req;
	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
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

	await removeUserDataProviderPermission(
		db,
		null,
		userKeycloakUserId,
		dataProviderShortCode,
		permission,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const putUserDataProviderPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const {
		params: { userKeycloakUserId, dataProviderShortCode, permission },
	} = req;

	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
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
	if (!isWritableUserFunderPermission(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserFunderPermission.errors ?? [],
		);
	}

	const userFunderPermission = await createOrUpdateUserDataProviderPermission(
		db,
		req,
		{
			userKeycloakUserId,
			dataProviderShortCode,
			permission,
		},
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userFunderPermission);
};

const userDataProviderPermissionsHandlers = {
	deleteUserDataProviderPermission,
	putUserDataProviderPermission,
};

export { userDataProviderPermissionsHandlers };
