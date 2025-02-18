import {
	db,
	createApplicationForm,
	createApplicationFormField,
	getLimitValues,
	loadApplicationForm,
	loadApplicationFormBundle,
} from '../database';
import {
	isTinyPgErrorWithQueryContext,
	isWritableApplicationFormWithFields,
	isId,
} from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import type { Request, Response, NextFunction } from 'express';

const getApplicationForms = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	loadApplicationFormBundle(db, null, limit, offset)
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
	const { id: applicationFormId } = req.params;
	if (!isId(applicationFormId)) {
		next(new InputValidationError('Invalid request.', isId.errors ?? []));
		return;
	}
	loadApplicationForm(db, null, applicationFormId)
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
	if (!isWritableApplicationFormWithFields(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableApplicationFormWithFields.errors ?? [],
			),
		);
		return;
	}
	const { fields } = req.body;

	(async () => {
		const applicationForm = await createApplicationForm(db, null, req.body);
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
		next(error);
	});
};

export const applicationFormsHandlers = {
	getApplicationForm,
	getApplicationForms,
	postApplicationForms,
};
