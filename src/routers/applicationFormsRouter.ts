import express from 'express';
import { applicationFormsHandlers } from '../handlers/applicationFormsHandlers';
import { checkApiKey as verifyAuth } from '../middleware/apiKeyChecker';

const applicationFormsRouter = express.Router();

applicationFormsRouter.get('/:id', verifyAuth, applicationFormsHandlers.getApplicationForm);
applicationFormsRouter.get('/', verifyAuth, applicationFormsHandlers.getApplicationForms);
applicationFormsRouter.post('/', verifyAuth, applicationFormsHandlers.postApplicationForms);

export { applicationFormsRouter };
