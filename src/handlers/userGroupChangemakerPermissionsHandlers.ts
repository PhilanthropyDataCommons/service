import {
	db,
	createOrUpdateUserGroupChangemakerPermission,
	removeUserGroupChangemakerPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isWritableUserGroupChangemakerPermission,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import type { Request, Response } from 'express';

const deleteUserGroupChangemakerPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const { keycloakOrganizationId, changemakerId, permission } = req.params;
	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
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

	await removeUserGroupChangemakerPermission(
		db,
		null,
		keycloakOrganizationId,
		changemakerId,
		permission,
	);
	res.status(204).contentType('application/json').send();
};

const putUserGroupChangemakerPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
		return;
	}

	const { keycloakOrganizationId, changemakerId, permission } = req.params;

	if (!isKeycloakId(keycloakOrganizationId)) {
		throw new InputValidationError(
			'Invalid keycloakOrganizationId parameter.',
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
	if (!isWritableUserGroupChangemakerPermission(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserGroupChangemakerPermission.errors ?? [],
		);
	}

	const userGroupChangemakerPermission =
		await createOrUpdateUserGroupChangemakerPermission(db, req, {
			keycloakOrganizationId,
			changemakerId,
			permission,
		});
	res
		.status(201)
		.contentType('application/json')
		.send(userGroupChangemakerPermission);
};

const userGroupChangemakerPermissionsHandlers = {
	deleteUserGroupChangemakerPermission,
	putUserGroupChangemakerPermission,
};

export { userGroupChangemakerPermissionsHandlers };
