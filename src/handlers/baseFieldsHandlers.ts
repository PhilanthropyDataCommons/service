import { HTTP_STATUS } from '../constants';
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
	isShortCode,
} from '../types';
import type { Request, Response } from 'express';
import type { ShortCode } from '../types';

const assertBaseFieldExists = async (
	baseFieldShortCode: ShortCode,
): Promise<void> => {
	await loadBaseField(db, null, baseFieldShortCode);
};

const getBaseFields = async (req: Request, res: Response): Promise<void> => {
	const baseFields = await loadBaseFields();
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(baseFields);
};

const putBaseField = async (
	req: Request<{ baseFieldShortCode: string }>,
	res: Response,
): Promise<void> => {
	const {
		params: { baseFieldShortCode },
	} = req;
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
	const {
		params: { baseFieldShortCode },
	} = req;
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
	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(baseFieldLocalizations);
};

const putBaseFieldLocalization = async (
	req: Request<{ baseFieldShortCode: ShortCode; language: string }>,
	res: Response,
): Promise<void> => {
	const {
		params: { baseFieldShortCode, language },
	} = req;
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

	const body = req.body as unknown;
	if (!isWritableBaseFieldLocalization(body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseFieldLocalization.errors ?? [],
		);
	}
	const { label, description } = body;
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
