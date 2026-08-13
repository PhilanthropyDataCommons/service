import { HTTP_STATUS } from '../constants';
import {
	createInitiativeFieldValue,
	getDatabase,
	getLimitValues,
	loadBaseField,
	loadInitiative,
	loadInitiativeFieldValue,
	loadInitiativeFieldValueBundle,
	loadSource,
	updateInitiativeFieldValue,
} from '../database';
import {
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
	isAuthContext,
	isId,
	isInitiativeFieldValuePatch,
	isWritableInitiativeFieldValue,
} from '../types';
import {
	FailedMiddlewareError,
	InputValidationError,
	UnprocessableEntityError,
} from '../errors';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import { fieldValueIsValid } from '../fieldValidation';
import type { BaseField, Id } from '../types';
import type { Request, Response } from 'express';

const extractInitiativeId = (req: Request): Id => {
	const { initiativeId } = coerceParams(req.params);
	if (!isId(initiativeId)) {
		throw new InputValidationError(
			'Invalid initiativeId parameter.',
			isId.errors ?? [],
		);
	}
	return initiativeId;
};

const extractFieldValueId = (req: Request): Id => {
	const { fieldValueId } = coerceParams(req.params);
	if (!isId(fieldValueId)) {
		throw new InputValidationError(
			'Invalid fieldValueId parameter.',
			isId.errors ?? [],
		);
	}
	return fieldValueId;
};

const assertBaseFieldIsUsableByInitiatives = (baseField: BaseField): void => {
	if (baseField.category === BaseFieldCategory.ORGANIZATION) {
		throw new UnprocessableEntityError(
			`Values for ${baseField.shortCode} must be provided in the context of a changemaker because this field is of category '${baseField.category}'.  Organization field values may not be posted here.`,
		);
	}
	if (
		baseField.sensitivityClassification ===
		BaseFieldSensitivityClassification.FORBIDDEN
	) {
		throw new UnprocessableEntityError(
			`Base field ${baseField.shortCode} is forbidden and cannot be used for initiative field values.`,
		);
	}
};

const getInitiativeFieldValues = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const initiativeId = extractInitiativeId(req);
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);

	await loadInitiative(db, req, initiativeId);

	const bundle = await loadInitiativeFieldValueBundle(
		db,
		req,
		initiativeId,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const getInitiativeFieldValue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const initiativeId = extractInitiativeId(req);
	const fieldValueId = extractFieldValueId(req);

	const initiativeFieldValue = await loadInitiativeFieldValue(
		db,
		req,
		initiativeId,
		fieldValueId,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(initiativeFieldValue);
};

const postInitiativeFieldValue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const initiativeId = extractInitiativeId(req);
	const body = req.body as unknown;
	if (!isWritableInitiativeFieldValue(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableInitiativeFieldValue.errors ?? [],
		);
	}
	const { baseFieldShortCode, sourceId, value, goodAsOf } = body;

	await loadInitiative(db, req, initiativeId);
	const baseField = await loadBaseField(db, req, baseFieldShortCode);
	assertBaseFieldIsUsableByInitiatives(baseField);
	await loadSource(db, req, sourceId);

	const initiativeFieldValue = await createInitiativeFieldValue(db, req, {
		initiativeId,
		baseFieldShortCode,
		sourceId,
		value,
		isValid: fieldValueIsValid(value, baseField.dataType),
		goodAsOf,
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(initiativeFieldValue);
};

const patchInitiativeFieldValue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
	const initiativeId = extractInitiativeId(req);
	const fieldValueId = extractFieldValueId(req);
	const body = req.body as unknown;
	if (!isInitiativeFieldValuePatch(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isInitiativeFieldValuePatch.errors ?? [],
		);
	}

	const existingInitiativeFieldValue = await loadInitiativeFieldValue(
		db,
		req,
		initiativeId,
		fieldValueId,
	);
	if (body.sourceId !== undefined) {
		await loadSource(db, req, body.sourceId);
	}

	const value = body.value ?? existingInitiativeFieldValue.value;
	const updatedInitiativeFieldValue = await updateInitiativeFieldValue(
		db,
		req,
		{
			...body,
			isValid: fieldValueIsValid(
				value,
				existingInitiativeFieldValue.baseField.dataType,
			),
		},
		initiativeId,
		fieldValueId,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(updatedInitiativeFieldValue);
};

const initiativeFieldValuesHandlers = {
	getInitiativeFieldValues,
	getInitiativeFieldValue,
	postInitiativeFieldValue,
	patchInitiativeFieldValue,
};

export { initiativeFieldValuesHandlers };
