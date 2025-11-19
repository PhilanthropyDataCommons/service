import express from 'express';
import { applicationFormFieldsHandlers } from '../handlers/applicationFormFieldsHandlers';
import { requireAuthentication } from '../middleware';

const applicationFormFieldsRouter = express.Router();

applicationFormFieldsRouter.patch(
	'/:applicationFormFieldId',
	requireAuthentication,
	applicationFormFieldsHandlers.patchApplicationFormField,
);

export { applicationFormFieldsRouter };
