import express from 'express';
import { filesHandlers } from '../handlers/filesHandlers';
import { requireAuthentication } from '../middleware';

const filesRouter = express.Router();

filesRouter.get('/', requireAuthentication, filesHandlers.getFiles);
filesRouter.post('/', requireAuthentication, filesHandlers.postFile);

export { filesRouter };
