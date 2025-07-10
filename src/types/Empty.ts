import type { Request } from 'express';

/**
 * For API calls where there is expected to be no data in the body.
 * @param req An express HTTP request.
 * @returns true when the request body is essentially empty, false otherwise.
 */
export const isBodyEmpty = (req: Request): boolean =>
	req.body === undefined ||
	req.body === null ||
	req.body === '' ||
	req.body === '{}';
