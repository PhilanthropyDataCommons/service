import type { Request } from 'express';

interface SearchParameters {
	search: string;
}

export const extractSearchParameters = (
	request: Request,
): SearchParameters => ({
	search: JSON.stringify(request.query._content),
});
