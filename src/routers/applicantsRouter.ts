import express from 'express';
import { applicantsHandlers } from '../handlers/applicantsHandlers';
import { checkApiKey as verifyAuth } from '../middleware/apiKeyChecker';

const applicantsRouter = express.Router();

applicantsRouter.get('/', verifyAuth, applicantsHandlers.getApplicants);
applicantsRouter.post('/', verifyAuth, applicantsHandlers.postApplicants);

export { applicantsRouter };
