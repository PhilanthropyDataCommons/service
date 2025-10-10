import {
	type BaseFieldSensitivityClassification,
	isBaseFieldSensitivityClassification,
} from '../../types';
import { InputValidationError } from '../../errors';

/**
 * An expanded version of a simple Query Parameter supporting a list of values and negation.
 * Negation will only work across the full list, not on each element. Two parameters for postgres
 * are herein contained in order to support this flexibility.
 *
 * TODO: can we have something akin to `E extends enum`? Enum isn't a class or type.
 */
export interface ExpandedParameterFilter<E> {
	isNegated: boolean;
	list: E[];
}

/**
 * Expands a simple Query Parameter string into a form that works with a PostgreSQL query.
 * @param parameter a name and value for the parameter.
 * @returns an ExpandedParameterFilter for PostgreSQL.
 * @throws Error when a comma-delimited string in value is not a BaseFieldSensivityClassification.
 */
export const expandBaseFieldSensitivityParameter = (
	value: string,
): ExpandedParameterFilter<BaseFieldSensitivityClassification> => {
	const FIRST_INDEX = 0;
	const INDEX_AFTER_ONE_CHAR = 1;
	const isNegated = value.startsWith('!');
	const rawList = value.split(',');
	if (isNegated && rawList[FIRST_INDEX] !== undefined) {
		rawList[FIRST_INDEX] = rawList[FIRST_INDEX].substring(INDEX_AFTER_ONE_CHAR);
	}

	// Filter out values that are not actually BaseFieldSensitivityClassification
	const list = rawList
		.map((s: string): BaseFieldSensitivityClassification | null => {
			const normalized = s.trim().toLowerCase();
			if (isBaseFieldSensitivityClassification(normalized)) {
				return normalized;
			}
			return null;
		})
		.filter(
			(value): value is BaseFieldSensitivityClassification => value !== null,
		);

	// Is .errors scoped correctly? Do I have a private copy here? Are all the errors here?
	if (isBaseFieldSensitivityClassification.errors !== undefined) {
		throw new InputValidationError(
			'Invalid BaseFieldSensitivityClassification values found',
			isBaseFieldSensitivityClassification.errors ?? [],
		);
	}

	return {
		isNegated,
		list,
	};
};
