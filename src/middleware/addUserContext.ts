import { createUser, loadUserByKeycloakUserId } from '../database';
import {
	getAuthSubFromRequest,
	isKeycloakId,
	keycloakIdToString,
	stringToKeycloakId,
} from '../types';
import { getSystemUser } from '../config';
import { InputValidationError } from '../errors';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest, KeycloakId } from '../types';

const selectOrCreateUser = async (keycloakUserId: KeycloakId) => {
	try {
		return await loadUserByKeycloakUserId(null, keycloakUserId);
	} catch {
		const user = await createUser(null, { keycloakUserId });
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
		keycloakUserId === keycloakIdToString(systemUser.keycloakUserId)
	) {
		next();
		return;
	}

	if (!isKeycloakId(keycloakUserId)) {
		next(
			new InputValidationError(
				'auth subject must be a valid keycloak user id',
				isKeycloakId.errors ?? [],
			),
		);
		return;
	}

	selectOrCreateUser(stringToKeycloakId(keycloakUserId))
		.then((user) => {
			(req as AuthenticatedRequest).user = user;
			next();
		})
		.catch((error: unknown) => {
			next(error);
		});
};

export { addUserContext };
