import type { Request } from 'express';

type CoercedParamValue = string | number | boolean;

type CoercedParams = Record<string, CoercedParamValue>;

const coerceParamValue = (value: string): CoercedParamValue => {
	if (value === 'true') return true;
	if (value === 'false') return false;
	if (value === '') return value;
	const number = Number(value);
	if (!Number.isNaN(number) && Number.isFinite(number)) {
		return number;
	}
	return value;
};

export const coerceParams = (params: Request['params']): CoercedParams => {
	const coercedParams: CoercedParams = {};
	for (const [key, value] of Object.entries(params)) {
		coercedParams[key] = coerceParamValue(value);
	}
	return coercedParams;
};
