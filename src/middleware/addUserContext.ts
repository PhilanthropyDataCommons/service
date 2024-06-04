import { createUser, loadUserByAuthenticationId } from '../database';
import type { NextFunction, Response } from 'express';
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
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	const authenticationId = req.auth?.sub;
	if (authenticationId === undefined || authenticationId === '') {
		next();
		return;
	}
	selectOrCreateUser(authenticationId)
		.then((user) => {
			req.user = user;
			next();
		})
		.catch((error: unknown) => {
			next(error);
		});
};

export { addUserContext };
