import { BaseFieldSensitivityClassification } from '../types';
import {
	expandBaseFieldSensitivityParameter,
	type ExpandedParameterFilter,
} from '../database/parameters';
import type { Request } from 'express';

export const DEFAULT_SENSITIVITY_FILTER: ExpandedParameterFilter<BaseFieldSensitivityClassification> =
	{
		negated: true,
		list: [BaseFieldSensitivityClassification.FORBIDDEN],
	};

export const extractBaseFieldSensitivityClassificationsParameter = (
	request: Pick<Request, 'query'>,
): ExpandedParameterFilter<BaseFieldSensitivityClassification> => {
	if (typeof request.query.sensitivityClassifications === 'string') {
		return expandBaseFieldSensitivityParameter(
			request.query.sensitivityClassifications,
		);
	}
	return DEFAULT_SENSITIVITY_FILTER;
};
