import { createUser, loadUserByKeycloakUserId } from '../database';
import { getAuthSubFromRequest } from '../types';
import { getSystemUser } from '../config';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';

const selectOrCreateUser = async (keycloakUserId: string) => {
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
		keycloakUserId === systemUser.keycloakUserId
	) {
		next();
		return;
	}
	selectOrCreateUser(keycloakUserId)
		.then((user) => {
			(req as AuthenticatedRequest).user = user;
			next();
		})
		.catch((error: unknown) => {
			next(error);
		});
};

export { addUserContext };
