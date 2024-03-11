import { createBaseField, loadBaseFields, updateBaseField } from '../database';
import { isTinyPgErrorWithQueryContext, isWritableBaseField } from '../types';
import { DatabaseError, InputValidationError } from '../errors';
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
	updateBaseField(id, {
		label: body.label,
		description: body.description,
		shortCode: body.shortCode,
		dataType: body.dataType,
	})
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

export const baseFieldsHandlers = {
	getBaseFields,
	postBaseField,
	putBaseField,
};
