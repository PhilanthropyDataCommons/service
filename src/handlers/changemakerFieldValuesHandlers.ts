import { HTTP_STATUS } from '../constants';
import {
	db,
	createChangemakerFieldValue,
	getLimitValues,
	loadBaseField,
	loadChangemaker,
	loadChangemakerFieldValue,
	loadChangemakerFieldValueBatch,
	loadChangemakerFieldValueBundle,
} from '../database';
import {
	isAuthContext,
	isId,
	isWritableChangemakerFieldValue,
	Permission,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	InputConflictError,
	NotFoundError,
	UnprocessableEntityError,
} from '../errors';
import {
	extractChangemakerFieldValueBatchParameters,
	extractChangemakerParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { coerceParams } from '../coercion';
import { authContextHasChangemakerPermission } from '../authorization';
import { fieldValueIsValid } from '../fieldValidation';
import type { Request, Response } from 'express';

const postChangemakerFieldValue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const body = req.body as unknown;
	if (!isWritableChangemakerFieldValue(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableChangemakerFieldValue.errors ?? [],
		);
	}

	const { changemakerId, baseFieldShortCode, batchId, value, goodAsOf } = body;

	// Verify changemaker exists
	await loadChangemaker(db, req, changemakerId).catch((error: unknown) => {
		if (error instanceof NotFoundError) {
			throw new InputConflictError('The changemaker does not exist.', {
				entityType: 'Changemaker',
				entityId: changemakerId,
			});
		}
		throw error;
	});

	if (
		!authContextHasChangemakerPermission(req, changemakerId, Permission.EDIT)
	) {
		throw new UnprocessableEntityError(
			'You do not have write permissions on this changemaker.',
		);
	}

	// Verify base field exists and validate its properties
	const baseField = await loadBaseField(db, req, baseFieldShortCode).catch(
		(error: unknown) => {
			if (error instanceof NotFoundError) {
				throw new InputConflictError('The base field does not exist.', {
					entityType: 'BaseField',
					entityShortCode: baseFieldShortCode,
				});
			}
			throw error;
		},
	);

	// Verify base field is organization category
	if (baseField.category !== BaseFieldCategory.ORGANIZATION) {
		throw new UnprocessableEntityError(
			`Values for ${baseField.shortCode} must be provided in the context of a proposal because this field is of category '${baseField.category}'.  Only 'organization' field values may be posted here.`,
		);
	}

	// Verify base field is not forbidden
	if (
		baseField.sensitivityClassification ===
		BaseFieldSensitivityClassification.FORBIDDEN
	) {
		throw new UnprocessableEntityError(
			`Base field ${baseField.shortCode} is forbidden and cannot be used for changemaker field values.`,
		);
	}

	// Verify batch exists
	await loadChangemakerFieldValueBatch(db, req, batchId).catch(
		(error: unknown) => {
			if (error instanceof NotFoundError) {
				throw new InputConflictError('The batch does not exist.', {
					entityType: 'ChangemakerFieldValueBatch',
					entityId: batchId,
				});
			}
			throw error;
		},
	);

	const isValid = fieldValueIsValid(value, baseField.dataType);

	const changemakerFieldValue = await createChangemakerFieldValue(db, req, {
		changemakerId,
		baseFieldShortCode,
		batchId,
		value,
		isValid,
		goodAsOf,
	});

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(changemakerFieldValue);
};

const getChangemakerFieldValues = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const { changemakerFieldValueBatchId } =
		extractChangemakerFieldValueBatchParameters(req);
	const { changemakerId } = extractChangemakerParameters(req);

	const bundle = await loadChangemakerFieldValueBundle(
		db,
		req,
		changemakerFieldValueBatchId,
		changemakerId,
		limit,
		offset,
	);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const getChangemakerFieldValue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const { fieldValueId } = coerceParams(req.params);
	if (!isId(fieldValueId)) {
		throw new InputValidationError(
			'Invalid fieldValueId parameter.',
			isId.errors ?? [],
		);
	}
	const fieldValue = await loadChangemakerFieldValue(db, req, fieldValueId);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(fieldValue);
};

export const changemakerFieldValuesHandlers = {
	getChangemakerFieldValue,
	getChangemakerFieldValues,
	postChangemakerFieldValue,
};
