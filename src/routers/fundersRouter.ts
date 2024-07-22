import express from 'express';
import { fundersHandlers } from '../handlers/fundersHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

const fundersRouter = express.Router();

fundersRouter.get('/', requireAuthentication, fundersHandlers.getFunders);

fundersRouter.get(
	'/:funderShortCode',
	requireAuthentication,
	fundersHandlers.getFunder,
);

fundersRouter.put(
	'/:funderShortCode',
	requireAdministratorRole,
	fundersHandlers.putFunder,
);

export { fundersRouter };
