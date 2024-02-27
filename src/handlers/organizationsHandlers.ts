import {
	getLimitValues,
	loadOrganizationBundle,
	loadOrganization,
} from '../database';
import { isIdParameters, isTinyPgErrorWithQueryContext } from '../types';
import { DatabaseError, InputValidationError } from '../errors';
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

const getOrganization = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isIdParameters(req.params)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isIdParameters.errors ?? [],
			),
		);
		return;
	}
	loadOrganization(req.params.id)
		.then((organization) => {
			res.status(200).contentType('application/json').send(organization);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving organization.', error));
				return;
			}
			next(error);
		});
};

export const organizationsHandlers = {
	getOrganizations,
	getOrganization,
};
