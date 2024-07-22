import express from 'express';
import { fundersHandlers } from '../handlers/fundersHandlers';
import { requireAuthentication } from '../middleware';

const fundersRouter = express.Router();

fundersRouter.post('/', requireAuthentication, fundersHandlers.postFunder);

fundersRouter.get('/', requireAuthentication, fundersHandlers.getFunders);

fundersRouter.get(
	'/:funderId',
	requireAuthentication,
	fundersHandlers.getFunder,
);

export { fundersRouter };
