import { DatabaseError, InputValidationError } from '../errors';
import {
	createBaseField,
	loadBaseFields,
	updateBaseField,
	db,
	createBaseFieldLocalization,
	updateBaseFieldLocalization,
} from '../database';
import {
	isTinyPgErrorWithQueryContext,
	isWritableBaseFieldWithLocalizations,
	isWritableBaseField,
	isWritableBaseFieldLocalization,
	iswritableBaseFieldLocalizationWithBaseFieldContext,
	iswritableBaseFieldLocalizationWithBaseFieldAndLanguageContext,
} from '../types';
import type { Request, Response, NextFunction } from 'express';

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
	if (!isWritableBaseFieldWithLocalizations(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableBaseFieldWithLocalizations.errors ?? [],
			),
		);
		return;
	}

	const { shortCode, dataType, scope, localizations } = req.body;

	db.transaction(async (transactionDb) => {
		const baseField = await createBaseField(
			{
				shortCode,
				dataType,
				scope,
			},
			transactionDb,
		);
		const baseFieldLocalizations = await Promise.all(
			localizations.map(async (localizationItem) => {
				const { language, label, description } = localizationItem;
				const createdLocalization = await createBaseFieldLocalization(
					{
						language,
						label,
						baseFieldId: baseField.id,
						description,
					},
					transactionDb,
				);
				return createdLocalization;
			}),
		);
		return {
			...baseField,
			localizations: baseFieldLocalizations,
		};
	})
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
		next(new InputValidationError('The entity id must be a number.', []));
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

const postBaseFieldLocalization = (
	req: Request<{ id: string }>,
	res: Response,
	next: NextFunction,
): void => {
	const id = Number.parseInt(req.params.id, 10);
	if (Number.isNaN(id)) {
		next(new InputValidationError('The entity id must be a number.', []));
		return;
	}
	if (!iswritableBaseFieldLocalizationWithBaseFieldContext(req.body)) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableBaseFieldLocalization.errors ?? [],
			),
		);
		return;
	}

	createBaseFieldLocalization({
		baseFieldId: id,
		...req.body,
	})
		.then((baseFieldLocalization) => {
			res
				.status(201)
				.contentType('application/json')
				.send(baseFieldLocalization);
		})
		.catch((error: unknown) => {
			if (isTinyPgErrorWithQueryContext(error)) {
				next(
					new DatabaseError('Error creating base field localization.', error),
				);
				return;
			}
			next(error);
		});
};

const putBaseFieldLocalization = (
	req: Request<{ id: string; language: string }>,
	res: Response,
	next: NextFunction,
) => {
	const id = Number.parseInt(req.params.id, 10);
	if (Number.isNaN(id)) {
		next(new InputValidationError('The entity id must be a number.', []));
		return;
	}

	if (
		!iswritableBaseFieldLocalizationWithBaseFieldAndLanguageContext(req.body)
	) {
		next(
			new InputValidationError(
				'Invalid request body.',
				isWritableBaseField.errors ?? [],
			),
		);
		return;
	}

	updateBaseFieldLocalization({
		...req.body,
		baseFieldId: id,
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
					new DatabaseError('Error updating base field localization.', error),
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
	postBaseFieldLocalization,
	putBaseFieldLocalization,
};
