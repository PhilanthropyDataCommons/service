import {
	db,
	createApplicationForm,
	createApplicationFormField,
	getLimitValues,
	hasFunderPermission,
	loadApplicationForm,
	loadApplicationFormBundle,
	loadOpportunity,
} from '../database';
import { HTTP_STATUS } from '../constants';
import {
	isWritableApplicationFormWithFields,
	isId,
	isAuthContext,
	PermissionGrantEntityType,
	PermissionGrantVerb,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	NotFoundError,
	UnauthorizedError,
	UnprocessableEntityError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const getApplicationForms = async (
	req: Request,
	res: Response,
): Promise<void> => {
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
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(applicationFormBundle);
};

const getApplicationForm = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { applicationFormId } = coerceParams(req.params);
	if (!isId(applicationFormId)) {
		throw new InputValidationError('Invalid request.', isId.errors ?? []);
	}

	const applicationForm = await loadApplicationForm(db, req, applicationFormId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(applicationForm);
};

const postApplicationForms = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritableApplicationFormWithFields(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableApplicationFormWithFields.errors ?? [],
		);
	}

	const { fields, opportunityId } = body;
	try {
		const opportunity = await loadOpportunity(db, req, opportunityId);
		if (
			!(await hasFunderPermission(db, req, {
				funderShortCode: opportunity.funderShortCode,
				permission: PermissionGrantVerb.EDIT,
				scope: PermissionGrantEntityType.FUNDER,
			}))
		) {
			throw new UnauthorizedError();
		}
		const finalApplicationForm = await db.transaction(async (transactionDb) => {
			const applicationForm = await createApplicationForm(transactionDb, null, {
				opportunityId,
			});
			const applicationFormFields = await Promise.all(
				fields.map(
					async (field) =>
						await createApplicationFormField(transactionDb, null, {
							...field,
							applicationFormId: applicationForm.id,
						}),
				),
			);
			return {
				...applicationForm,
				fields: applicationFormFields,
			};
		});
		res
			.status(HTTP_STATUS.SUCCESSFUL.CREATED)
			.contentType('application/json')
			.send(finalApplicationForm);
	} catch (error: unknown) {
		if (error instanceof NotFoundError) {
			throw new UnprocessableEntityError('A related entity was not found');
		}
		throw error;
	}
};

const getApplicationFormProposalDataCsv = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const { applicationFormId } = coerceParams(req.params);
	if (!isId(applicationFormId)) {
		throw new InputValidationError('Invalid request.', isId.errors ?? []);
	}

	const applicationForm = await loadApplicationForm(db, req, applicationFormId);

	const labels = applicationForm.fields.map((field) => field.label).join(',');

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('text/csv')
		.setHeader(
			'Content-Disposition',
			`attachment; filename="application-form-${applicationFormId}-proposal-data.csv"`,
		)
		.send(`${labels}\n`);
};

export const applicationFormsHandlers = {
	getApplicationForm,
	getApplicationFormProposalDataCsv,
	getApplicationForms,
	postApplicationForms,
};
