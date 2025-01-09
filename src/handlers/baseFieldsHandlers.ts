import { DatabaseError, InputValidationError } from '../errors';
import {
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
	isTinyPgErrorWithQueryContext,
	isValidLanguageTag,
	isWritableBaseField,
	isWritableBaseFieldLocalization,
	isId,
} from '../types';
import type { Request, Response, NextFunction } from 'express';

const assertBaseFieldExists = async (baseFieldId: number): Promise<void> => {
	await loadBaseField(null, baseFieldId);
};

const getBaseFields = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	loadBaseFields()
		.then((baseFields) => {
			res.status(200).contentType('application/json').send(baseFields);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error retrieving base fields.', error));
				return;
			}
			next(error);
		});
};

const postBaseField = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!isWritableBaseField(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableBaseField.errors ?? [],
			),
		);
		return;
	}

	createBaseField(req.body)
		.then((baseField) => {
			res.status(201).contentType('application/json').send(baseField);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error creating base field.', error));
				return;
			}
			next(error);
		});
};

const putBaseField = (
	req: Request<{ id: string }>,
	res: Response,
	next: NextFunction,
) => {
	const id = Number.parseInt(req.params.id, 10);
	if (Number.isNaN(id)) {
		next(new InputValidationError('Invalid id parameter.', isId.errors ?? []));
		return;
	}
	const body = req.body as unknown;
	if (!isWritableBaseField(body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableBaseField.errors ?? [],
			),
		);
		return;
	}

	updateBaseField(id, body)
		.then((baseField) => {
			res.status(200).contentType('application/json').send(baseField);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(new DatabaseError('Error updating base field.', error));
				return;
			}
			next(error);
		});
};

const getBaseFieldLocalizationsByBaseFieldId = (
	req: Request<{ baseFieldId: string }>,
	res: Response,
	next: NextFunction,
): void => {
	const baseFieldId = Number.parseInt(req.params.baseFieldId, 10);
	if (!isId(baseFieldId)) {
		next(new InputValidationError('Invalid id parameter.', isId.errors ?? []));
		return;
	}
	const paginationParameters = extractPaginationParameters(req);
	const { offset, limit } = getLimitValues(paginationParameters);
	assertBaseFieldExists(baseFieldId)
		.then(() => {
			loadBaseFieldLocalizationsBundleByBaseFieldId(
				undefined,
				baseFieldId,
				limit,
				offset,
			)
				.then((baseFieldLocalizations) => {
					res
						.status(200)
						.contentType('application/json')
						.send(baseFieldLocalizations);
				})
				.catch((error: unknown) => {
					if (isTinyPgErrorWithQueryContext(error)) {
						next(new DatabaseError('Error retrieving base fields.', error));
						return;
					}
					next(error);
				});
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(
					new DatabaseError(
						'Something went wrong when asserting the validity of the provided Base Field.',
						error,
					),
				);
				return;
			}
			next(error);
		});
};

const putBaseFieldLocalization = (
	req: Request<{ baseFieldId: string; language: string }>,
	res: Response,
	next: NextFunction,
) => {
	const baseFieldId = Number.parseInt(req.params.baseFieldId, 10);
	if (!isId(baseFieldId)) {
		next(new InputValidationError('Invalid id parameter.', isId.errors ?? []));
		return;
	}

	if (!isValidLanguageTag(req.params.language)) {
		next(
			new InputValidationError(
				'The entity language must be a valid IETF language tag',
				isValidLanguageTag.errors ?? [],
			),
		);
		return;
	}

	if (!isWritableBaseFieldLocalization(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableBaseField.errors ?? [],
			),
		);
		return;
	}
	const { label, description } = req.body;
	assertBaseFieldExists(baseFieldId)
		.then(() => {
			createOrUpdateBaseFieldLocalization({
				label,
				description,
				baseFieldId,
				language: req.params.language,
			})
				.then((baseFieldLocalization) => {
					res
						.status(200)
						.contentType('application/json')
						.send(baseFieldLocalization);
				})
				.catch((error: unknown) => {
					if (isTinyPgErrorWithQueryContext(error)) {
						next(
							new DatabaseError(
								'Error updating base field localization.',
								error,
							),
						);
						return;
					}
					next(error);
				});
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(
					new DatabaseError(
						'Something went wrong when asserting the validity of the provided Base Field.',
						error,
					),
				);
				return;
			}
			next(error);
		});
};

export const baseFieldsHandlers = {
	getBaseFields,
	postBaseField,
	putBaseField,
	getBaseFieldLocalizationsByBaseFieldId,
	putBaseFieldLocalization,
};
