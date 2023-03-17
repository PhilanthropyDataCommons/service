import express from 'express';
import { applicantsHandlers } from '../handlers/applicantsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const applicantsRouter = express.Router();

applicantsRouter.get('/', verifyAuth, applicantsHandlers.getApplicants);
applicantsRouter.post('/', verifyAuth, applicantsHandlers.postApplicants);

export { applicantsRouter };
