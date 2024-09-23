import type { Request } from 'express';

export const extractSearchParameters = (request: Request) => ({
	/* eslint-disable no-underscore-dangle */
	search: request.query._content?.toString(),
	/* eslint-enable no-underscore-dangle */
});
