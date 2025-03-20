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
	isWritableApplicationFormWithFields,
	isId,
	isAuthContext,
	Permission,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	NotFoundError,
	UnauthorizedError,
	UnprocessableEntityError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { authContextHasFunderPermission } from '../authorization';
import type { Request, Response } from 'express';

const getApplicationForms = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const applicationFormBundle = await loadApplicationFormBundle(
		db,
		req,
		limit,
		offset,
	);
	res.status(200).contentType('application/json').send(applicationFormBundle);
};

const getApplicationForm = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { applicationFormId } = req.params;
	if (!isId(applicationFormId)) {
		throw new InputValidationError('Invalid request.', isId.errors ?? []);
	}

	const applicationForm = await loadApplicationForm(db, req, applicationFormId);
	res.status(200).contentType('application/json').send(applicationForm);
};

const postApplicationForms = async (req: Request, res: Response) => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	if (!isWritableApplicationFormWithFields(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableApplicationFormWithFields.errors ?? [],
		);
	}
	const { fields, opportunityId } = req.body;

	try {
		const opportunity = await loadOpportunity(db, req, opportunityId);
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
	} catch (error: unknown) {
		if (error instanceof NotFoundError) {
			throw new UnprocessableEntityError('A related entity was not found');
		}
		throw error;
	}
};

export const applicationFormsHandlers = {
	getApplicationForm,
	getApplicationForms,
	postApplicationForms,
};
