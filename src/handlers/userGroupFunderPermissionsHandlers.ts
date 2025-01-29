import {
	db,
	assertUserGroupFunderPermissionExists,
	createOrUpdateUserGroupFunderPermission,
	removeUserGroupFunderPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isShortCode,
	isTinyPgErrorWithQueryContext,
	isWritableUserGroupFunderPermission,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import type { Request, Response, NextFunction } from 'express';

const deleteUserGroupFunderPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { keycloakOrganizationId, funderShortCode, permission } = req.params;
	if (!isKeycloakId(keycloakOrganizationId)) {
		next(
			new InputValidationError(
				'Invalid keycloakOrganizationId parameter.',
				isKeycloakId.errors ?? [],
			),
		);
		return;
	}
	if (!isShortCode(funderShortCode)) {
		next(
			new InputValidationError(
				'Invalid shortCode parameter.',
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
		await assertUserGroupFunderPermissionExists(
			keycloakOrganizationId,
			funderShortCode,
			permission,
		);
		await removeUserGroupFunderPermission(
			keycloakOrganizationId,
			funderShortCode,
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

const putUserGroupFunderPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	const { keycloakOrganizationId, funderShortCode, permission } = req.params;
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
	if (!isShortCode(funderShortCode)) {
		next(
			new InputValidationError(
				'Invalid funderShortCode parameter.',
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
	if (!isWritableUserGroupFunderPermission(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableUserGroupFunderPermission.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		const userGroupFunderPermission =
			await createOrUpdateUserGroupFunderPermission(db, null, {
				keycloakOrganizationId,
				funderShortCode,
				permission,
				createdBy,
			});
		res
			.status(201)
			.contentType('application/json')
			.send(userGroupFunderPermission);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating item.', error));
			return;
		}
		next(error);
	});
};

const userGroupFunderPermissionsHandlers = {
	deleteUserGroupFunderPermission,
	putUserGroupFunderPermission,
};

export { userGroupFunderPermissionsHandlers };
