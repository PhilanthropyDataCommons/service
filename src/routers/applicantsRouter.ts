import express from 'express';
import { applicantsHandlers } from '../handlers/applicantsHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const applicantsRouter = express.Router();

applicantsRouter.get('/', checkApiKey, applicantsHandlers.getApplicants);
applicantsRouter.post('/', checkApiKey, applicantsHandlers.postApplicants);

export { applicantsRouter };
