import express from 'express';
import { applicationFormsHandlers } from '../handlers/applicationFormsHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const applicationFormsRouter = express.Router();

applicationFormsRouter.get('/', applicationFormsHandlers.getApplicationForms);
applicationFormsRouter.post('/', checkApiKey, applicationFormsHandlers.postApplicationForms);

export { applicationFormsRouter };
