import express from 'express';
import { presignedPostRequestsHandlers } from '../handlers/presignedPostRequestsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const presignedPostRequestsRouter = express.Router();

presignedPostRequestsRouter.post('/', verifyAuth, presignedPostRequestsHandlers.createPresignedPostRequest);

export { presignedPostRequestsRouter };
