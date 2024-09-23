import { createUser, loadUserByAuthenticationId } from '../database';
import { getAuthSubFromRequest } from '../types';
import type { Request, NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';

const selectOrCreateUser = async (authenticationId: string) => {
	try {
		return await loadUserByAuthenticationId(authenticationId);
	} catch {
		const user = await createUser({ authenticationId });
		return user;
	}
};

const addUserContext = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const authenticationId = getAuthSubFromRequest(req);
	if (authenticationId === undefined || authenticationId === '') {
		next();
		return;
	}
	selectOrCreateUser(authenticationId)
		.then((user) => {
			(req as AuthenticatedRequest).user = user;
			next();
		})
		.catch((error: unknown) => {
			next(error);
		});
};

export { addUserContext };
