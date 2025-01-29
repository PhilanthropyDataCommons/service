import {
	db,
	assertOrganizationChangemakerPermissionExists,
	createOrUpdateOrganizationChangemakerPermission,
	removeOrganizationChangemakerPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isTinyPgErrorWithQueryContext,
	isWritableOrganizationChangemakerPermission,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import type { Request, Response, NextFunction } from 'express';

const deleteOrganizationChangemakerPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { keycloakOrganizationId, changemakerId, permission } = req.params;
	if (!isKeycloakId(keycloakOrganizationId)) {
		next(
			new InputValidationError(
				'Invalid keycloakOrganizationId parameter.',
				isKeycloakId.errors ?? [],
			),
		);
		return;
	}
	if (!isId(changemakerId)) {
		next(
			new InputValidationError(
				'Invalid changemakerId parameter.',
				isId.errors ?? [],
			),
		);
		return;
	}
	if (!isPermission(permission)) {
		next(
			new InputValidationError(
				'Invalid permission parameter.',
				isPermission.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		await assertOrganizationChangemakerPermissionExists(
			keycloakOrganizationId,
			changemakerId,
			permission,
		);
		await removeOrganizationChangemakerPermission(
			keycloakOrganizationId,
			changemakerId,
			permission,
		);
		res.status(204).contentType('application/json').send();
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error deleting item.', error));
			return;
		}
		next(error);
	});
};

const putOrganizationChangemakerPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	const { keycloakOrganizationId, changemakerId, permission } = req.params;
	const createdBy = req.user.keycloakUserId;

	if (!isKeycloakId(keycloakOrganizationId)) {
		next(
			new InputValidationError(
				'Invalid keycloakOrganizationId parameter.',
				isKeycloakId.errors ?? [],
			),
		);
		return;
	}
	if (!isId(changemakerId)) {
		next(
			new InputValidationError(
				'Invalid changemakerId parameter.',
				isId.errors ?? [],
			),
		);
		return;
	}
	if (!isPermission(permission)) {
		next(
			new InputValidationError(
				'Invalid permission parameter.',
				isPermission.errors ?? [],
			),
		);
		return;
	}
	if (!isWritableOrganizationChangemakerPermission(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableOrganizationChangemakerPermission.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		const organizationChangemakerPermission =
			await createOrUpdateOrganizationChangemakerPermission(db, null, {
				keycloakOrganizationId,
				changemakerId,
				permission,
				createdBy,
			});
		res
			.status(201)
			.contentType('application/json')
			.send(organizationChangemakerPermission);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating item.', error));
			return;
		}
		next(error);
	});
};

const organizationChangemakerPermissionsHandlers = {
	deleteOrganizationChangemakerPermission,
	putOrganizationChangemakerPermission,
};

export { organizationChangemakerPermissionsHandlers };
