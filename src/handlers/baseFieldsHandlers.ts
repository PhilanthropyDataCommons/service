import { InputValidationError } from '../errors';
import {
	db,
	createBaseField,
	loadBaseFields,
	updateBaseField,
	createOrUpdateBaseFieldLocalization,
	loadBaseFieldLocalizationsBundleByBaseFieldId,
	loadBaseField,
	getLimitValues,
} from '../database';
import { extractPaginationParameters } from '../queryParameters';
import {
	isValidLanguageTag,
	isWritableBaseField,
	isWritableBaseFieldLocalization,
	isId,
} from '../types';
import type { Request, Response } from 'express';

const assertBaseFieldExists = async (baseFieldId: number): Promise<void> => {
	await loadBaseField(db, null, baseFieldId);
};

const getBaseFields = async (req: Request, res: Response) => {
	const baseFields = await loadBaseFields();
	res.status(200).contentType('application/json').send(baseFields);
};

const postBaseField = async (req: Request, res: Response) => {
	if (!isWritableBaseField(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseField.errors ?? [],
		);
	}

	const baseField = await createBaseField(db, null, req.body);
	res.status(201).contentType('application/json').send(baseField);
};

const putBaseField = async (
	req: Request<{ baseFieldId: string }>,
	res: Response,
) => {
	const baseFieldId = Number.parseInt(req.params.baseFieldId, 10);
	if (Number.isNaN(baseFieldId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	if (!isWritableBaseField(req.body)) {
		throw new InputValidationError(
			'Invalid request body.',
			isWritableBaseField.errors ?? [],
		);
	}

	await assertBaseFieldExists(baseFieldId);
	const {
		label,
		description,
		shortCode,
		dataType,
		scope,
		valueRelevanceHours,
	} = req.body;
	const baseField = await updateBaseField(
		db,
		null,
		{
			label,
			description,
			shortCode,
			dataType,
			scope,
			valueRelevanceHours,
		},
		baseFieldId,
	);
	res.status(200).contentType('application/json').send(baseField);
};

const getBaseFieldLocalizationsByBaseFieldId = async (
	req: Request<{ baseFieldId: string }>,
	res: Response,
) => {
	const baseFieldId = Number.parseInt(req.params.baseFieldId, 10);
	if (!isId(baseFieldId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	await assertBaseFieldExists(baseFieldId);
	const baseFieldLocalizations =
		await loadBaseFieldLocalizationsBundleByBaseFieldId(
			db,
			null,
			baseFieldId,
			limit,
			offset,
		);
	res.status(200).contentType('application/json').send(baseFieldLocalizations);
};

const putBaseFieldLocalization = async (
	req: Request<{ baseFieldId: string; language: string }>,
	res: Response,
) => {
	const baseFieldId = Number.parseInt(req.params.baseFieldId, 10);
	if (!isId(baseFieldId)) {
		throw new InputValidationError('Invalid id parameter.', isId.errors ?? []);
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
			isWritableBaseField.errors ?? [],
		);
	}
	const { label, description } = req.body;
	await assertBaseFieldExists(baseFieldId);
	const baseFieldLocalization = await createOrUpdateBaseFieldLocalization(
		db,
		null,
		{
			label,
			description,
			baseFieldId,
			language: req.params.language,
		},
	);
	res.status(200).contentType('application/json').send(baseFieldLocalization);
};

export const baseFieldsHandlers = {
	getBaseFields,
	postBaseField,
	putBaseField,
	getBaseFieldLocalizationsByBaseFieldId,
	putBaseFieldLocalization,
};
