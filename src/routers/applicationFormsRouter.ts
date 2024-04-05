import express from 'express';
import { applicationFormsHandlers } from '../handlers/applicationFormsHandlers';
import { requireAuthentication } from '../middleware';

const applicationFormsRouter = express.Router();

applicationFormsRouter.get(
	'/:id',
	requireAuthentication,
	applicationFormsHandlers.getApplicationForm,
);
applicationFormsRouter.get(
	'/',
	requireAuthentication,
	applicationFormsHandlers.getApplicationForms,
);
applicationFormsRouter.post(
	'/',
	requireAuthentication,
	applicationFormsHandlers.postApplicationForms,
);

export { applicationFormsRouter };
