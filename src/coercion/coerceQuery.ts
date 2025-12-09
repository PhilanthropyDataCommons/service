import type { Request } from 'express';

type CoercedQueryNonArrayValue = string | number | boolean;

type CoercedQueryArrayValue = CoercedQueryNonArrayValue[];

type CoercedQueryValue = CoercedQueryNonArrayValue | CoercedQueryArrayValue;

type CoercedQuery = Record<string, CoercedQueryValue>;

const coerceQueryNonArrayValue = (value: string): CoercedQueryNonArrayValue => {
	if (value === 'true') return true;
	if (value === 'false') return false;
	if (value === '') return value;
	const number = Number(value);
	if (!Number.isNaN(number) && Number.isFinite(number)) {
		return number;
	}
	return value;
};

const coerceQueryArrayValue = (value: string[]): CoercedQueryArrayValue =>
	value.map(coerceQueryNonArrayValue);

export const coerceQuery = (query: Request['query']): CoercedQuery => {
	const coercedQuery: CoercedQuery = {};
	for (const [key, value] of Object.entries(query)) {
		if (value === undefined) {
			continue;
		}
		if (typeof value === 'string') {
			coercedQuery[key] = coerceQueryNonArrayValue(value);
		} else if (
			Array.isArray(value) &&
			value.every((item) => typeof item === 'string')
		) {
			coercedQuery[key] = coerceQueryArrayValue(value);
		}
	}
	return coercedQuery;
};
