import { db, createOrUpdateUser } from '../database';
import {
	getAuthSubFromRequest,
	isKeycloakId,
	keycloakIdToString,
	stringToKeycloakId,
} from '../types';
import { getSystemUser } from '../config';
import { InputValidationError } from '../errors';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';

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

	createOrUpdateUser(db, null, {
		keycloakUserId: stringToKeycloakId(keycloakUserId),
	})
		.then((user) => {
			(req as AuthenticatedRequest).user = user;
			next();
		})
		.catch((error: unknown) => {
			next(error);
		});
};

export { addUserContext };
