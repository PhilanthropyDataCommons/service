import { InputValidationError } from '../errors';
import { BaseFieldSensitivityClassification, isPaginationParametersQuery } from '../types';
import type { Request } from 'express';

export const extractFilterParameter = ({
	query,
  paramType, // This?
  parameterName, // Maybe?
}: Pick<Request, 'query' | 'parameterName'>): any => {
	if (!isPaginationParametersQuery(query)) {
		throw new InputValidationError(
			'Invalid pagination parameters.',
			isPaginationParametersQuery.errors ?? [],
		);
	}

	const obj = {};
  obj[parameterName] = query.baseFieldSensitivityClassificationFilter;
  return obj;
};
