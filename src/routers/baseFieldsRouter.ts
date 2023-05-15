import express from 'express';
import { baseFieldsHandlers } from '../handlers/baseFieldsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const baseFieldsRouter = express.Router();

baseFieldsRouter.get('/', verifyAuth, baseFieldsHandlers.getBaseFields);
baseFieldsRouter.post('/', verifyAuth, baseFieldsHandlers.postBaseField);

export { baseFieldsRouter };
