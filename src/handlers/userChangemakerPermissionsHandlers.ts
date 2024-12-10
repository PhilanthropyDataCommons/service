import {
	assertUserChangemakerPermissionExists,
	createOrUpdateUserChangemakerPermission,
	removeUserChangemakerPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isTinyPgErrorWithQueryContext,
	isWritableUserChangemakerPermission,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import type { Request, Response, NextFunction } from 'express';

const deleteUserChangemakerPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { userKeycloakUserId, changemakerId, permission } = req.params;
	if (!isKeycloakId(userKeycloakUserId)) {
		next(
			new InputValidationError(
				'Invalid userKeycloakUserId parameter.',
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
		await assertUserChangemakerPermissionExists(
			userKeycloakUserId,
			changemakerId,
			permission,
		);
		await removeUserChangemakerPermission(
			userKeycloakUserId,
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

const putUserChangemakerPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	const { userKeycloakUserId, changemakerId, permission } = req.params;
	const createdBy = req.user.keycloakUserId;

	if (!isKeycloakId(userKeycloakUserId)) {
		next(
			new InputValidationError(
				'Invalid userKeycloakUserId parameter.',
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
	if (!isWritableUserChangemakerPermission(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableUserChangemakerPermission.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		const userChangemakerPermission =
			await createOrUpdateUserChangemakerPermission({
				userKeycloakUserId,
				changemakerId,
				permission,
				createdBy,
			});
		res
			.status(201)
			.contentType('application/json')
			.send(userChangemakerPermission);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating item.', error));
			return;
		}
		next(error);
	});
};

const userChangemakerPermissionsHandlers = {
	deleteUserChangemakerPermission,
	putUserChangemakerPermission,
};

export { userChangemakerPermissionsHandlers };
