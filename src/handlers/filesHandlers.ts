import { HTTP_STATUS } from '../constants';
import { isAuthContext, isWritableFile } from '../types';
import { createFile } from '../database/operations';
import { db } from '../database';
import { InputValidationError, FailedMiddlewareError } from '../errors';
import type { Request, Response } from 'express';

const postFile = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritableFile(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableFile.errors ?? [],
		);
	}

	const file = await createFile(db, req, body);
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(file);
};

export const filesHandlers = {
	postFile,
};
