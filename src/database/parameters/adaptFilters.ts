import { BaseFieldSensitivityClassification, isBaseFieldSensitivityClassification } from '../../types';

interface AdaptedEnumFilter<E> {
	name: string;
	isNegated: boolean;
	list: E[];
}

export const getBaseFieldSensitivity = (parameter: {
	name: string;
	value: string;
}): AdaptedEnumFilter<BaseFieldSensitivityClassification> => {
	const FIRST_INDEX = 0;
	const INDEX_AFTER_ONE_CHAR = 1;
	const { name } = parameter;
	const isNegated = parameter.value.startsWith('!');
	const rawList = parameter.value.split(',');
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

	return {
		name,
		isNegated,
		list,
	};
};
