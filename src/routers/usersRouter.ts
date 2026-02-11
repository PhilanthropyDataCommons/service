import express from 'express';
import { usersHandlers } from '../handlers/usersHandlers';
import { requireAuthentication } from '../middleware';

const usersRouter = express.Router();

usersRouter.get('/', requireAuthentication, usersHandlers.getUsers);

export { usersRouter };
