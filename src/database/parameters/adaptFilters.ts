import {
	type BaseFieldSensitivityClassification,
	isBaseFieldSensitivityClassification,
} from '../../types';

/**
 * An expanded version of a simple Query Parameter supporting a list of values and negation.
 * Negation will only work across the full list, not on each element. Three parameters for postgres
 * are herein contained in order to support this flexibility.
 *
 * TODO: can we have something akin to `E extends enum`? Enum isn't a class or type.
 */
export interface ExpandedParameterFilter<E> {
	name: string;
	isNegated: boolean;
	list: E[];
}

/**
 * Expands a simple Query Parameter string into a form that works with a PostgreSQL query.
 * @param parameter a name and value for the parameter.
 * @returns an ExpandedParameterFilter for PostgreSQL.
 * @throws Error when a comma-delimited string in value is not a BaseFieldSensivityClassification.
 */
export const expandBaseFieldSensitivityParameter = (parameter: {
	name: string;
	value: string;
}): ExpandedParameterFilter<BaseFieldSensitivityClassification> => {
	const FIRST_INDEX = 0;
	const ZERO_ELEMENTS = 0;
	const INDEX_AFTER_ONE_CHAR = 1;
	const { name } = parameter;
	const isNegated = parameter.value.startsWith('!');
	const rawList = parameter.value.split(',');
	if (isNegated && rawList[FIRST_INDEX] !== undefined) {
		rawList[FIRST_INDEX] = rawList[FIRST_INDEX].substring(INDEX_AFTER_ONE_CHAR);
	}

	// Filter out values that are not actually BaseFieldSensitivityClassification
	const errors: Error[] = [];
	const list = rawList
		.map((s: string): BaseFieldSensitivityClassification | null => {
			const normalized = s.trim().toLowerCase();
			if (isBaseFieldSensitivityClassification(normalized)) {
				return normalized;
			}
			errors.push(
				new Error(`${s} is not a BaseFieldSensitivityClassification`),
			);
			return null;
		})
		.filter(
			(value): value is BaseFieldSensitivityClassification => value !== null,
		);

	// TODO: See if we can use AJV and InputValidationError here.
	if (errors.length > ZERO_ELEMENTS) {
		throw new Error(`Invalid values: ${JSON.stringify(errors)}`);
	}

	return {
		name,
		isNegated,
		list,
	};
};
