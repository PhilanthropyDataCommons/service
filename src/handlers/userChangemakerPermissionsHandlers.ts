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

const deleteUserChangemakerPermission = async (req: Request, res: Response) => {
	const { userKeycloakUserId, changemakerId, permission } = req.params;
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
	res.status(204).contentType('application/json').send();
};

const putUserChangemakerPermission = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { userKeycloakUserId, changemakerId, permission } = req.params;
	const createdBy = req.user.keycloakUserId;

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
		await createOrUpdateUserChangemakerPermission(db, null, {
			userKeycloakUserId,
			changemakerId,
			permission,
			createdBy,
		});
	res
		.status(201)
		.contentType('application/json')
		.send(userChangemakerPermission);
};

const userChangemakerPermissionsHandlers = {
	deleteUserChangemakerPermission,
	putUserChangemakerPermission,
};

export { userChangemakerPermissionsHandlers };
