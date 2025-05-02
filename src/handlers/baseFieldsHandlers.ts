import { InputValidationError } from '../errors';
import {
	db,
	createOrUpdateBaseField,
	loadBaseFields,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldLocalizationsBundleByBaseFieldShortCode,
	loadBaseField,
	getLimitValues,
} from '../database';
import { extractPaginationParameters } from '../queryParameters';
import {
	isValidLanguageTag,
	isWritableBaseField,
	isWritableBaseFieldLocalization,
	isId,
	ShortCode,
	isShortCode,
} from '../types';
import type { Request, Response } from 'express';

const assertBaseFieldExists = async (
	baseFieldShortCode: ShortCode,
): Promise<void> => {
	await loadBaseField(db, null, baseFieldShortCode);
};

const getBaseFields = async (req: Request, res: Response) => {
	const baseFields = await loadBaseFields();
	res.status(200).contentType('application/json').send(baseFields);
};

const putBaseField = async (
	req: Request<{ baseFieldShortCode: string }>,
	res: Response,
) => {
	const { baseFieldShortCode } = req.params;
	if (!isShortCode(baseFieldShortCode)) {
		throw new InputValidationError(
			'Invalid short code parameter.',
			isShortCode.errors ?? [],
		);
	}
	if (!isWritableBaseField(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseField.errors ?? [],
		);
	}

	const { label, description, dataType, scope, valueRelevanceHours } = req.body;
	const baseField = await createOrUpdateBaseField(db, null, {
		label,
		description,
		dataType,
		scope,
		valueRelevanceHours,
		shortCode: baseFieldShortCode,
	});
	res.status(200).contentType('application/json').send(baseField);
};

const getBaseFieldLocalizationsByBaseFieldShortCode = async (
	req: Request<{ baseFieldShortCode: ShortCode }>,
	res: Response,
) => {
	const { baseFieldShortCode } = req.params;
	if (!isShortCode(baseFieldShortCode)) {
		throw new InputValidationError(
			'Invalid short code parameter.',
			isShortCode.errors ?? [],
		);
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	await assertBaseFieldExists(baseFieldShortCode);
	const baseFieldLocalizations =
		await loadBaseFieldLocalizationsBundleByBaseFieldShortCode(
			db,
			null,
			baseFieldShortCode,
			limit,
			offset,
		);
	res.status(200).contentType('application/json').send(baseFieldLocalizations);
};

const putBaseFieldLocalization = async (
	req: Request<{ baseFieldShortCode: ShortCode; language: string }>,
	res: Response,
) => {
	const { baseFieldShortCode, language } = req.params;
	if (!isShortCode(baseFieldShortCode)) {
		throw new InputValidationError(
			'Invalid shortcode parameter.',
			isId.errors ?? [],
		);
	}

	if (!isValidLanguageTag(req.params.language)) {
		throw new InputValidationError(
			'The entity language must be a valid IETF language tag',
			isValidLanguageTag.errors ?? [],
		);
	}

	if (!isWritableBaseFieldLocalization(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseFieldLocalization.errors ?? [],
		);
	}
	const { label, description } = req.body;
	await assertBaseFieldExists(baseFieldShortCode);
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
	res.status(200).contentType('application/json').send(baseFieldLocalization);
};

export const baseFieldsHandlers = {
	getBaseFields,
	putBaseField,
	getBaseFieldLocalizationsByBaseFieldShortCode,
	putBaseFieldLocalization,
};
