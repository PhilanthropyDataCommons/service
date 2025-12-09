import { coerceString } from './coerceString';
import type { Request } from 'express';
import type { CoercedString } from './coerceString';

type CoercedParams = Record<string, CoercedString>;

export const coerceParams = (params: Request['params']): CoercedParams => {
	const coercedParams: CoercedParams = {};
	for (const [key, value] of Object.entries(params)) {
		coercedParams[key] = coerceString(value);
	}
	return coercedParams;
};
