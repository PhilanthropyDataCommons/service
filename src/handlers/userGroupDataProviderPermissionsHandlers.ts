import {
	db,
	assertUserGroupDataProviderPermissionExists,
	createOrUpdateUserGroupDataProviderPermission,
	removeUserGroupDataProviderPermission,
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

const deleteUserGroupDataProviderPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { keycloakOrganizationId, dataProviderShortCode, permission } =
		req.params;
	if (!isKeycloakId(keycloakOrganizationId)) {
		next(
			new InputValidationError(
				'Invalid keycloakOrganizationId parameter.',
				isKeycloakId.errors ?? [],
			),
		);
		return;
	}
	if (!isShortCode(dataProviderShortCode)) {
		next(
			new InputValidationError(
				'Invalid dataProviderShortCode parameter.',
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
		await assertUserGroupDataProviderPermissionExists(
			keycloakOrganizationId,
			dataProviderShortCode,
			permission,
		);
		await removeUserGroupDataProviderPermission(
			keycloakOrganizationId,
			dataProviderShortCode,
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

const putUserGroupDataProviderPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	const { keycloakOrganizationId, dataProviderShortCode, permission } =
		req.params;
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
	if (!isShortCode(dataProviderShortCode)) {
		next(
			new InputValidationError(
				'Invalid dataProviderShortCode parameter.',
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
			await createOrUpdateUserGroupDataProviderPermission(db, null, {
				keycloakOrganizationId,
				dataProviderShortCode,
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

const userGroupDataProviderPermissionsHandlers = {
	deleteUserGroupDataProviderPermission,
	putUserGroupDataProviderPermission,
};

export { userGroupDataProviderPermissionsHandlers };
