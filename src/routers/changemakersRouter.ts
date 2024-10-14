import express from 'express';
import { changemakersHandlers } from '../handlers/changemakersHandlers';
import { requireAuthentication } from '../middleware';

const changemakersRouter = express.Router();

changemakersRouter.get('/', changemakersHandlers.getChangemakers);

changemakersRouter.get('/:changemakerId', changemakersHandlers.getChangemaker);

changemakersRouter.post(
	'/',
	requireAuthentication,
	changemakersHandlers.postChangemaker,
);

export { changemakersRouter };
