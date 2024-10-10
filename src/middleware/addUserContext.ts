import { createUser, loadUserByKeycloakUserId } from '../database';
import {
	getAuthSubFromRequest,
	isKeycloakUserId,
	keycloakUserIdToString,
	stringToKeycloakUserId,
} from '../types';
import { getSystemUser } from '../config';
import { InputValidationError } from '../errors';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest, KeycloakUserId } from '../types';

const selectOrCreateUser = async (keycloakUserId: KeycloakUserId) => {
	try {
		return await loadUserByKeycloakUserId(keycloakUserId);
	} catch {
		const user = await createUser({ keycloakUserId });
		return user;
	}
};

const addUserContext = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const keycloakUserId = getAuthSubFromRequest(req);
	const systemUser = getSystemUser();
	if (
		keycloakUserId === undefined ||
		keycloakUserId === keycloakUserIdToString(systemUser.keycloakUserId)
	) {
		next();
		return;
	}

	if (!isKeycloakUserId(keycloakUserId)) {
		next(
			new InputValidationError(
				'auth subject must be a valid keycloak user id',
				isKeycloakUserId.errors ?? [],
			),
		);
		return;
	}

	selectOrCreateUser(stringToKeycloakUserId(keycloakUserId))
		.then((user) => {
			(req as AuthenticatedRequest).user = user;
			next();
		})
		.catch((error: unknown) => {
			next(error);
		});
};

export { addUserContext };
