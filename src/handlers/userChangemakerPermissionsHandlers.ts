import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateUserChangemakerPermission,
	removeUserChangemakerPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isWritableUserChangemakerPermission,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import type { Request, Response } from 'express';

const deleteUserChangemakerPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const {
		params: { userKeycloakUserId, changemakerId, permission },
	} = req;
	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isId(changemakerId)) {
		throw new InputValidationError(
			'Invalid changemakerId parameter.',
			isId.errors ?? [],
		);
	}
	if (!isPermission(permission)) {
		throw new InputValidationError(
			'Invalid permission parameter.',
			isPermission.errors ?? [],
		);
	}

	await removeUserChangemakerPermission(
		db,
		null,
		userKeycloakUserId,
		changemakerId,
		permission,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const putUserChangemakerPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const {
		params: { userKeycloakUserId, changemakerId, permission },
	} = req;

	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isId(changemakerId)) {
		throw new InputValidationError(
			'Invalid changemakerId parameter.',
			isId.errors ?? [],
		);
	}
	if (!isPermission(permission)) {
		throw new InputValidationError(
			'Invalid permission parameter.',
			isPermission.errors ?? [],
		);
	}
	if (!isWritableUserChangemakerPermission(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserChangemakerPermission.errors ?? [],
		);
	}

	const userChangemakerPermission =
		await createOrUpdateUserChangemakerPermission(db, req, {
			userKeycloakUserId,
			changemakerId,
			permission,
		});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userChangemakerPermission);
};

const userChangemakerPermissionsHandlers = {
	deleteUserChangemakerPermission,
	putUserChangemakerPermission,
};

export { userChangemakerPermissionsHandlers };
