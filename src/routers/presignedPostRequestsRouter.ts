import express from 'express';
import { presignedPostRequestsHandlers } from '../handlers/presignedPostRequestsHandlers';
import { requireAuthentication } from '../middleware';

const presignedPostRequestsRouter = express.Router();

presignedPostRequestsRouter.post(
	'/',
	requireAuthentication,
	presignedPostRequestsHandlers.createPresignedPostRequest,
);

export { presignedPostRequestsRouter };
