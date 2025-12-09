import { HTTP_STATUS } from '../constants';
import {
	db,
	createOrUpdateUserOpportunityPermission,
	removeUserOpportunityPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isOpportunityPermission,
	isWritableUserOpportunityPermission,
} from '../types';
import { FailedMiddlewareError, InputValidationError } from '../errors';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const deleteUserOpportunityPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const { userKeycloakUserId, opportunityId, opportunityPermission } =
		coerceParams(req.params);
	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isId(opportunityId)) {
		throw new InputValidationError(
			'Invalid opportunityId parameter.',
			isId.errors ?? [],
		);
	}
	if (!isOpportunityPermission(opportunityPermission)) {
		throw new InputValidationError(
			'Invalid opportunityPermission parameter.',
			isOpportunityPermission.errors ?? [],
		);
	}

	await removeUserOpportunityPermission(
		db,
		null,
		userKeycloakUserId,
		opportunityId,
		opportunityPermission,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.NO_CONTENT)
		.contentType('application/json')
		.send();
};

const putUserOpportunityPermission = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { userKeycloakUserId, opportunityId, opportunityPermission } =
		coerceParams(req.params);

	if (!isKeycloakId(userKeycloakUserId)) {
		throw new InputValidationError(
			'Invalid userKeycloakUserId parameter.',
			isKeycloakId.errors ?? [],
		);
	}
	if (!isId(opportunityId)) {
		throw new InputValidationError(
			'Invalid opportunityId parameter.',
			isId.errors ?? [],
		);
	}
	if (!isOpportunityPermission(opportunityPermission)) {
		throw new InputValidationError(
			'Invalid opportunityPermission parameter.',
			isOpportunityPermission.errors ?? [],
		);
	}
	if (!isWritableUserOpportunityPermission(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableUserOpportunityPermission.errors ?? [],
		);
	}

	const userOpportunityPermission =
		await createOrUpdateUserOpportunityPermission(db, req, {
			userKeycloakUserId,
			opportunityId,
			opportunityPermission,
		});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(userOpportunityPermission);
};

const userOpportunityPermissionsHandlers = {
	deleteUserOpportunityPermission,
	putUserOpportunityPermission,
};

export { userOpportunityPermissionsHandlers };
