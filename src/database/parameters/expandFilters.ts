import { InputValidationError } from '../../errors';
import { isBaseFieldSensitivityClassificationArray } from '../../types/BaseFieldSensitivityClassificationArray';
import type { BaseFieldSensitivityClassification } from '../../types';

/**
 * An expanded version of a simple Query Parameter supporting a list of values and negation.
 * Negation will only work across the full list, not on each element. Two parameters for postgres
 * are herein contained in order to support this flexibility.
 */
export interface ExpandedParameterFilter<E> {
	negated: boolean;
	list: E[];
}

/**
 * Expands a simple Query Parameter string into a form that works with a PostgreSQL query.
 * @param value the raw string to expand.
 * @returns an ExpandedParameterFilter for PostgreSQL.
 * @throws Error when the format is invalid and/or unparseable.
 */
export const expandBaseFieldSensitivityParameter = (
	value: string,
): ExpandedParameterFilter<BaseFieldSensitivityClassification> => {
	let sensitivityFilter: string = value.trim();
	if (sensitivityFilter === 'all') {
		return {
			negated: true,
			list: [],
		};
	}
	const INDEX_AFTER_ONE_CHAR = 1;
	const negated = sensitivityFilter.startsWith('!');
	if (negated) {
		sensitivityFilter = sensitivityFilter.substring(INDEX_AFTER_ONE_CHAR);
	}
	try {
		const list: unknown = JSON.parse(sensitivityFilter);
		if (isBaseFieldSensitivityClassificationArray(list)) {
			return {
				negated,
				list,
			};
		}
		throw new InputValidationError(
			'Invalid BaseFieldSensitivityClassification value(s) found',
			isBaseFieldSensitivityClassificationArray.errors ?? [],
		);
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new InputValidationError(
				'Expected a JSON Array of BaseFieldSensitivityClassification, e.g. ["public"], but got something unparseable',
				[],
			);
		}
		throw error;
	}
};
