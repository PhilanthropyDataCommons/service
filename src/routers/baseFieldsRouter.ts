import express from 'express';
import { baseFieldsHandlers } from '../handlers/baseFieldsHandlers';
import { requireAuthentication } from '../middleware';

const baseFieldsRouter = express.Router();

baseFieldsRouter.get('/', baseFieldsHandlers.getBaseFields);
baseFieldsRouter.post(
	'/',
	requireAuthentication,
	baseFieldsHandlers.postBaseField,
);
baseFieldsRouter.put(
	'/:id',
	requireAuthentication,
	baseFieldsHandlers.putBaseField,
);

export { baseFieldsRouter };
