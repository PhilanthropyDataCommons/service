import { HTTP_STATUS } from '../constants';
import { InputValidationError } from '../errors';
import {
	getDatabase,
	createOrUpdateBaseField,
	loadBaseFieldBundle,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldLocalizationsBundleByBaseFieldShortCode,
	loadBaseField,
	getLimitValues,
} from '../database';
import { extractPaginationParameters } from '../queryParameters';
import { coerceParams } from '../coercion';
import {
	isAuthContext,
	isValidLanguageTag,
	isWritableBaseField,
	isWritableBaseFieldLocalization,
	isId,
	isShortCode,
} from '../types';
import { extractBaseFieldSensitivityClassificationsParameter } from '../queryParameters/extractBaseFieldSensitivityClassificationsParameter';
import type { Request, Response } from 'express';
import type { ShortCode } from '../types';
import type { TinyPg } from 'tinypg';

const assertBaseFieldExists = async (
	db: Pick<TinyPg, 'sql'>,
	baseFieldShortCode: ShortCode,
): Promise<void> => {
	await loadBaseField(db, null, baseFieldShortCode);
};

const getBaseFields = async (req: Request, res: Response): Promise<void> => {
	const db = getDatabase();
	const authContext = isAuthContext(req) ? req : null;
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	const sensitivityClassificationFilter =
		extractBaseFieldSensitivityClassificationsParameter(req);
	const baseFieldBundle = await loadBaseFieldBundle(
		db,
		authContext,
		sensitivityClassificationFilter,
		limit,
		offset,
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(baseFieldBundle);
};

const putBaseField = async (
	req: Request<{ baseFieldShortCode: string }>,
	res: Response,
): Promise<void> => {
	const db = getDatabase();
	const { baseFieldShortCode } = coerceParams(req.params);
	if (!isShortCode(baseFieldShortCode)) {
		throw new InputValidationError(
			'Invalid short code parameter.',
			isShortCode.errors ?? [],
		);
	}

	const body = req.body as unknown;
	if (!isWritableBaseField(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseField.errors ?? [],
		);
	}

	const {
		label,
		description,
		dataType,
		category,
		valueRelevanceHours,
		sensitivityClassification,
	} = body;
	const baseField = await createOrUpdateBaseField(db, null, {
		label,
		description,
		dataType,
		category,
		valueRelevanceHours,
		sensitivityClassification,
		shortCode: baseFieldShortCode,
	});
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(baseField);
};

const getBaseFieldLocalizationsByBaseFieldShortCode = async (
	req: Request<{ baseFieldShortCode: ShortCode }>,
	res: Response,
): Promise<void> => {
	const db = getDatabase();
	const { baseFieldShortCode } = coerceParams(req.params);
	if (!isShortCode(baseFieldShortCode)) {
		throw new InputValidationError(
			'Invalid short code parameter.',
			isShortCode.errors ?? [],
		);
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	await assertBaseFieldExists(db, baseFieldShortCode);
	const baseFieldLocalizations =
		await loadBaseFieldLocalizationsBundleByBaseFieldShortCode(
			db,
			null,
			baseFieldShortCode,
			limit,
			offset,
		);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(baseFieldLocalizations);
};

const putBaseFieldLocalization = async (
	req: Request<{ baseFieldShortCode: ShortCode; language: string }>,
	res: Response,
): Promise<void> => {
	const db = getDatabase();
	const { baseFieldShortCode, language } = coerceParams(req.params);
	if (!isShortCode(baseFieldShortCode)) {
		throw new InputValidationError(
			'Invalid shortcode parameter.',
			isId.errors ?? [],
		);
	}

	if (!isValidLanguageTag(language)) {
		throw new InputValidationError(
			'The entity language must be a valid IETF language tag',
			isValidLanguageTag.errors ?? [],
		);
	}

	const body = req.body as unknown;
	if (!isWritableBaseFieldLocalization(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseFieldLocalization.errors ?? [],
		);
	}
	const { label, description } = body;
	await assertBaseFieldExists(db, baseFieldShortCode);
	const baseFieldLocalization = await createOrUpdateBaseFieldLocalization(
		db,
		null,
		{
			label,
			description,
			baseFieldShortCode,
			language,
		},
	);
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(baseFieldLocalization);
};

export const baseFieldsHandlers = {
	getBaseFields,
	putBaseField,
	getBaseFieldLocalizationsByBaseFieldShortCode,
	putBaseFieldLocalization,
};
