import { HTTP_STATUS } from '../constants';
import {
	getDatabase,
	hasApplicationFormPermission,
	loadApplicationFormField,
	updateApplicationFormField,
} from '../database';
import {
	isId,
	isAuthContext,
	isApplicationFormFieldPatch,
	PermissionGrantEntityType,
	PermissionGrantVerb,
} from '../types';
import {
	FailedMiddlewareError,
	ForbiddenError,
	InputValidationError,
} from '../errors';
import { coerceParams } from '../coercion';
import type { Request, Response } from 'express';

const patchApplicationFormField = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
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

	const applicationFormField = await loadApplicationFormField(
		db,
		req,
		applicationFormFieldId,
	);

	if (
		!(await hasApplicationFormPermission(db, req, {
			applicationFormId: applicationFormField.applicationFormId,
			permission: PermissionGrantVerb.EDIT,
			scope: PermissionGrantEntityType.APPLICATION_FORM,
		}))
	) {
		throw new ForbiddenError(
			'Authenticated user does not have permission to edit the specified application form field.',
		);
	}

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
