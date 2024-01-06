import { db } from '../../db';
import { InternalValidationError } from '../../../errors';
import type { TinyPgParams } from 'tinypg';
import type { ValidateFunction } from 'ajv';

export const loadObjects = async <T extends object>(
	tinyPgQueryName: string,
	tinyPgQueryParameters: TinyPgParams,
	objectValidator: ValidateFunction<T>,
): Promise<T[]> => {
	const { rows } = await db.sql<T>(tinyPgQueryName, tinyPgQueryParameters);

	rows.forEach((row) => {
		if (!objectValidator(row)) {
			throw new InternalValidationError(
				'The database responded with an unexpected format.',
				objectValidator.errors ?? [],
			);
		}
	});

	return rows;
};
