import {
	db,
	assertOrganizationFunderPermissionExists,
	createOrUpdateOrganizationFunderPermission,
	removeOrganizationFunderPermission,
} from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isShortCode,
	isTinyPgErrorWithQueryContext,
	isWritableOrganizationFunderPermission,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import type { Request, Response, NextFunction } from 'express';

const deleteOrganizationFunderPermission = (
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
		await assertOrganizationFunderPermissionExists(
			keycloakOrganizationId,
			funderShortCode,
			permission,
		);
		await removeOrganizationFunderPermission(
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

const putOrganizationFunderPermission = (
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
	if (!isWritableOrganizationFunderPermission(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableOrganizationFunderPermission.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		const organizationFunderPermission =
			await createOrUpdateOrganizationFunderPermission(db, null, {
				keycloakOrganizationId,
				funderShortCode,
				permission,
				createdBy,
			});
		res
			.status(201)
			.contentType('application/json')
			.send(organizationFunderPermission);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating item.', error));
			return;
		}
		next(error);
	});
};

const organizationFunderPermissionsHandlers = {
	deleteOrganizationFunderPermission,
	putOrganizationFunderPermission,
};

export { organizationFunderPermissionsHandlers };
