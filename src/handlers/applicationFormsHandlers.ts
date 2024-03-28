import {
	createApplicationForm,
	createApplicationFormField,
	loadApplicationForm,
	loadApplicationFormBundle,
	loadApplicationFormFieldBundle,
} from '../database';
import {
	isTinyPgErrorWithQueryContext,
	isWritableApplicationFormWithFields,
	isId,
} from '../types';
import { DatabaseError, InputValidationError } from '../errors';
import type { Request, Response, NextFunction } from 'express';

const getApplicationForms = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	loadApplicationFormBundle()
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

const getShallowApplicationForm = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { id: applicationFormId } = req.params;
	if (!isId(applicationFormId)) {
		next(new InputValidationError('Invalid request.', isId.errors ?? []));
		return;
	}
	loadApplicationForm(applicationFormId)
		.then((applicationForm) => {
			res.status(200).contentType('application/json').send(applicationForm);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving application forms.', error));
				return;
			}
			next(error);
		});
};

const getApplicationFormWithFields = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const { id: applicationFormId } = req.params;
	if (!isId(applicationFormId)) {
		next(new InputValidationError('Invalid request body.', isId.errors ?? []));
		return;
	}
	loadApplicationForm(applicationFormId)
		.then((baseApplicationForm) => {
			loadApplicationFormFieldBundle({
				applicationFormId,
			})
				.then(({ entries: applicationFormFields }) => {
					const applicationForm = {
						...baseApplicationForm,
						fields: applicationFormFields,
					};
					res.status(200).contentType('application/json').send(applicationForm);
				})
				.catch((error: unknown) => {
					if (isTinyPgErrorWithQueryContext(error)) {
						next(
							new DatabaseError('Error retrieving application form.', error),
						);
						return;
					}
					next(error);
				});
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving application form.', error));
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
	if (
		req.query.includeFields !== undefined &&
		req.query.includeFields === 'true'
	) {
		getApplicationFormWithFields(req, res, next);
	} else {
		getShallowApplicationForm(req, res, next);
	}
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

	createApplicationForm(req.body)
		.then((applicationForm) => {
			const queries = fields.map(async (field) =>
				createApplicationFormField({
					...field,
					applicationFormId: applicationForm.id,
				}),
			);
			Promise.all(queries)
				.then((applicationFormFields) => {
					res
						.status(201)
						.contentType('application/json')
						.send({
							...applicationForm,
							fields: applicationFormFields,
						});
				})
				.catch((error: unknown) => {
					if (isTinyPgErrorWithQueryContext(error)) {
						next(new DatabaseError('Error creating application form.', error));
						return;
					}
					next(error);
				});
		})
		.catch((error: unknown) => {
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
