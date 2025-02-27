import {
	db,
	createApplicationForm,
	createApplicationFormField,
	getLimitValues,
	loadApplicationForm,
	loadApplicationFormBundle,
	loadOpportunity,
} from '../database';
import {
	isTinyPgErrorWithQueryContext,
	isWritableApplicationFormWithFields,
	isId,
	isAuthContext,
	Permission,
} from '../types';
import {
	DatabaseError,
	FailedMiddlewareError,
	InputValidationError,
	NotFoundError,
	UnauthorizedError,
	UnprocessableEntityError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { authContextHasFunderPermission } from '../authorization';
import type { Request, Response, NextFunction } from 'express';

const getApplicationForms = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	loadApplicationFormBundle(db, req, limit, offset)
		.then((applicationForms) => {
			res.status(200).contentType('application/json').send(applicationForms);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving application forms.', error));
				return;
			}
			next(error);
		});
};

const getApplicationForm = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	const { applicationFormId } = req.params;
	if (!isId(applicationFormId)) {
		next(new InputValidationError('Invalid request.', isId.errors ?? []));
		return;
	}
	loadApplicationForm(db, req, applicationFormId)
		.then((applicationForm) => {
			res.status(200).contentType('application/json').send(applicationForm);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving application form.', error));
				return;
			}
			next(error);
		});
};

const postApplicationForms = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isAuthContext(req)) {
		next(new FailedMiddlewareError('Unexpected lack of auth context.'));
		return;
	}

	if (!isWritableApplicationFormWithFields(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableApplicationFormWithFields.errors ?? [],
			),
		);
		return;
	}
	const { fields, opportunityId } = req.body;
	(async () => {
		const opportunity = await loadOpportunity(db, null, opportunityId);
		if (
			!authContextHasFunderPermission(
				req,
				opportunity.funderShortCode,
				Permission.EDIT,
			)
		) {
			throw new UnauthorizedError();
		}
		const applicationForm = await createApplicationForm(db, null, {
			opportunityId,
		});
		const applicationFormFields = await Promise.all(
			fields.map(async (field) =>
				createApplicationFormField(db, null, {
					...field,
					applicationFormId: applicationForm.id,
				}),
			),
		);
		res
			.status(201)
			.contentType('application/json')
			.send({
				...applicationForm,
				fields: applicationFormFields,
			});
	})().catch((error: unknown) => {
		if (isTinyPgErrorWithQueryContext(error)) {
			next(new DatabaseError('Error creating application form.', error));
			return;
		}
		if (error instanceof NotFoundError) {
			next(new UnprocessableEntityError('A related entity was not found'));
			return;
		}
		next(error);
	});
};

export const applicationFormsHandlers = {
	getApplicationForm,
	getApplicationForms,
	postApplicationForms,
};
