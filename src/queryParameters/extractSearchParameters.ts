import type { Request } from 'express';

export const extractSearchParameters = (request: Request) => ({
	search: JSON.stringify(request.query._content),
});
