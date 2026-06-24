import { HTTP_STATUS } from '../constants';
import {
	createPermissionGrant,
	getDatabase,
	createChangemakerFieldValue,
	getLimitValues,
	hasChangemakerPermission,
	loadBaseField,
	loadChangemaker,
	loadChangemakerFieldValue,
	loadChangemakerFieldValueBatch,
	loadChangemakerFieldValueBundle,
} from '../database';
import {
	getSelfManageGrantFragment,
	isAuthContext,
	isId,
	isWritableChangemakerFieldValue,
	PermissionGrantEntityType,
	PermissionGrantVerb,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
} from '../types';
import {
	FailedMiddlewareError,
	ForbiddenError,
	InputValidationError,
	UnprocessableEntityError,
} from '../errors';
import {
	extractChangemakerFieldValueBatchParameters,
	extractChangemakerParameters,
	extractPaginationParameters,
} from '../queryParameters';
import { coerceParams } from '../coercion';
import { fieldValueIsValid } from '../fieldValidation';
import type { Request, Response } from 'express';

const postChangemakerFieldValue = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();

	const body = req.body as unknown;
	if (!isWritableChangemakerFieldValue(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableChangemakerFieldValue.errors ?? [],
		);
	}

	const { changemakerId, baseFieldShortCode, batchId, value, goodAsOf } = body;

	await loadChangemaker(db, req, changemakerId);

	if (
		!(await hasChangemakerPermission(db, req, {
			changemakerId,
			permission: PermissionGrantVerb.CREATE,
			scope: PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
		}))
	) {
		throw new ForbiddenError(
			'Authenticated user does not have permission to create field values for the specified changemaker.',
		);
	}

	// Verify base field exists and validate its properties
	const baseField = await loadBaseField(db, req, baseFieldShortCode);

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

	await loadChangemakerFieldValueBatch(db, req, batchId);

	const isValid = fieldValueIsValid(value, baseField.dataType);

	const committedChangemakerFieldValue = await db.transaction(async (txDb) => {
		const changemakerFieldValue = await createChangemakerFieldValue(txDb, req, {
			changemakerId,
			baseFieldShortCode,
			batchId,
			value,
			isValid,
			goodAsOf,
		});
		await createPermissionGrant(txDb, req, {
			...getSelfManageGrantFragment(req),
			contextEntityType: PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
			changemakerFieldValueId: changemakerFieldValue.id,
		});
		return changemakerFieldValue;
	});

	res
		.status(HTTP_STATUS.SUCCESSFUL.CREATED)
		.contentType('application/json')
		.send(committedChangemakerFieldValue);
};

const getChangemakerFieldValues = async (
	req: Request,
	res: Response,
): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}
	const db = getDatabase();
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
	const db = getDatabase();
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
