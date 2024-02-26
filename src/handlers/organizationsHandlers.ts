import { getLimitValues, loadOrganizationBundle } from '../database';
import { isTinyPgErrorWithQueryContext } from '../types';
import { DatabaseError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const getOrganizations = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	loadOrganizationBundle({
		...getLimitValues(paginationParameters),
	})
		.then((organizationBundle) => {
			res.status(200).contentType('application/json').send(organizationBundle);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving organizations.', error));
				return;
			}
			next(error);
		});
};

export const organizationsHandlers = {
	getOrganizations,
};
