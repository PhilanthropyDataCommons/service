import { getLogger } from '../logger';
import {
	createApplicationForm,
	createApplicationFormField,
	db,
	loadApplicationFormFieldBundle,
} from '../database';
import {
	isTinyPgErrorWithQueryContext,
	isWritableApplicationFormWithFields,
	isId,
} from '../types';
import {
	DatabaseError,
	InputValidationError,
	InternalValidationError,
	NotFoundError,
} from '../errors';
import type { Request, Response, NextFunction } from 'express';
import type { Result } from 'tinypg';
import type { ApplicationForm } from '../types';

const logger = getLogger(__filename);

const getApplicationForms = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	db.sql('applicationForms.selectAll')
		.then((applicationFormsQueryResult: Result<ApplicationForm>) => {
			logger.debug(applicationFormsQueryResult);
			const { rows: applicationForms } = applicationFormsQueryResult;
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
	db.sql('applicationForms.selectById', { id: req.params.id })
		.then((applicationFormsQueryResult: Result<ApplicationForm>) => {
			if (applicationFormsQueryResult.row_count === 0) {
				throw new NotFoundError(
					'Not found. Find existing application forms by calling with no parameters.',
				);
			}
			const applicationForm = applicationFormsQueryResult.rows[0];
			if (applicationForm === undefined) {
				throw new InternalValidationError(
					'The database responded with an unexpected format.',
					[],
				);
			}
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
	db.sql('applicationForms.selectById', { id: req.params.id })
		.then((applicationFormsQueryResult: Result<ApplicationForm>) => {
			if (applicationFormsQueryResult.row_count === 0) {
				throw new NotFoundError(
					'Not found. Find existing application forms by calling with no parameters.',
				);
			}
			const baseApplicationForm = applicationFormsQueryResult.rows[0];
			if (baseApplicationForm === undefined) {
				throw new InternalValidationError(
					'The database responded with an unexpected format.',
					[],
				);
			}
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
