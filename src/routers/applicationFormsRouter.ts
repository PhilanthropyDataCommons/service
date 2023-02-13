import express from 'express';
import { applicationFormsHandlers } from '../handlers/applicationFormsHandlers';
import { checkApiKey } from '../middleware/apiKeyChecker';

const applicationFormsRouter = express.Router();

applicationFormsRouter.get('/:id', checkApiKey, applicationFormsHandlers.getApplicationForm);
applicationFormsRouter.get('/', checkApiKey, applicationFormsHandlers.getApplicationForms);
applicationFormsRouter.post('/', checkApiKey, applicationFormsHandlers.postApplicationForms);

export { applicationFormsRouter };
