import express from 'express';
import { filesHandlers } from '../handlers/filesHandlers';
import { requireAuthentication } from '../middleware';

const filesRouter = express.Router();

filesRouter.post('/', requireAuthentication, filesHandlers.postFile);

export { filesRouter };
