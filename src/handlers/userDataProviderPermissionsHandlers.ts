import { createOrUpdateUserDataProviderPermission } from '../database';
import {
	isAuthContext,
	isId,
	isKeycloakId,
	isPermission,
	isShortCode,
	isTinyPgErrorWithQueryContext,
	isWritableUserFunderPermission,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
} from '../errors';
import type { Request, Response, NextFunction } from 'express';

const putUserDataProviderPermission = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	const { userKeycloakUserId, dataProviderShortCode, permission } = req.params;
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
	if (!isWritableUserFunderPermission(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableUserFunderPermission.errors ?? [],
			),
		);
		return;
	}

	(async () => {
		const userFunderPermission = await createOrUpdateUserDataProviderPermission(
			{
				userKeycloakUserId,
				dataProviderShortCode,
				permission,
				createdBy,
			},
		);
		res.status(201).contentType('application/json').send(userFunderPermission);
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating item.', error));
			return;
		}
		next(error);
	});
};

const userDataProviderPermissionsHandlers = {
	putUserDataProviderPermission,
};

export { userDataProviderPermissionsHandlers };
