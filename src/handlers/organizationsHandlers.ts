import {
	getLimitValues,
	loadOrganizationBundle,
	loadOrganization,
	createOrganization,
} from '../database';
import {
	isIdParameters,
	isWritableOrganization,
	isTinyPgErrorWithQueryContext,
} from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const postOrganization = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isWritableOrganization(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableOrganization.errors ?? [],
			),
		);
		return;
	}
	createOrganization(req.body)
		.then((organization) => {
			res.status(201).contentType('application/json').send(organization);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating base field.', error));
				return;
			}
			next(error);
		});
};

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
	postOrganization,
	getOrganizations,
	getOrganization,
};
