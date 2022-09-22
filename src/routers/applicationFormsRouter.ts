import express from 'express';
import { applicationFormsHandlers } from '../handlers/applicationFormsHandlers';

const applicationFormsRouter = express.Router();

applicationFormsRouter.get('/', applicationFormsHandlers.getApplicationForms);
applicationFormsRouter.post('/', applicationFormsHandlers.postApplicationForms);

export { applicationFormsRouter };
