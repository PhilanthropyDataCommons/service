import {
	type CoercedString,
	coerceString,
	coerceStrings,
} from './coerceString';
import type { Request } from 'express';

type CoercedQueryValue = CoercedString[] | CoercedString;

type CoercedQuery = Record<string, CoercedQueryValue>;

export const coerceQuery = (query: Request['query']): CoercedQuery => {
	const coercedQuery: CoercedQuery = {};
	for (const [key, value] of Object.entries(query)) {
		if (value === undefined) {
			continue;
		}
		if (typeof value === 'string') {
			coercedQuery[key] = coerceString(value);
		} else if (
			Array.isArray(value) &&
			value.every((item) => typeof item === 'string')
		) {
			coercedQuery[key] = coerceStrings(value);
		}
	}
	return coercedQuery;
};
