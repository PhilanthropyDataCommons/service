import { HTTP_STATUS } from '../constants';
import {
	db,
	loadApplicationForm,
	loadApplicationFormField,
	loadOpportunity,
	updateApplicationFormField,
} from '../database';
import {
	isId,
	isAuthContext,
	isApplicationFormFieldPatch,
	Permission,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	UnauthorizedError,
} from '../errors';
import { authContextHasFunderPermission } from '../authorization';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';
import type { AuthContext } from '../types';

const checkApplicationFormFieldPermission = async (
	authContext: AuthContext,
	applicationFormFieldId: number,
	permission: Permission,
): Promise<void> => {
	const applicationFormField = await loadApplicationFormField(
		db,
		authContext,
		applicationFormFieldId,
	);

	const applicationForm = await loadApplicationForm(
		db,
		authContext,
		applicationFormField.applicationFormId,
	);

	const opportunity = await loadOpportunity(
		db,
		authContext,
		applicationForm.opportunityId,
	);

	if (
		!authContextHasFunderPermission(
			authContext,
			opportunity.funderShortCode,
			permission,
		)
	) {
		throw new UnauthorizedError();
	}
};

const patchApplicationFormField = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { applicationFormFieldId } = coerceParams(req.params);
	if (!isId(applicationFormFieldId)) {
		throw new InputValidationError(
			'Invalid request parameter.',
			isId.errors ?? [],
		);
	}

	if (!isApplicationFormFieldPatch(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isApplicationFormFieldPatch.errors ?? [],
		);
	}

	await checkApplicationFormFieldPermission(
		req,
		applicationFormFieldId,
		Permission.EDIT,
	);

	const updatedField = await updateApplicationFormField(
		db,
		null,
		req.body,
		applicationFormFieldId,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(updatedField);
};

export const applicationFormFieldsHandlers = {
	patchApplicationFormField,
};
