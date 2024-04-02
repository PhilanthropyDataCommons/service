import express from 'express';
import { bulkUploadsHandlers } from '../handlers/bulkUploadsHandlers';
import { verifyJwt as verifyAuth } from '../middleware/verifyJwt';

const bulkUploadsRouter = express.Router();

bulkUploadsRouter.post('/', verifyAuth, bulkUploadsHandlers.postBulkUpload);
bulkUploadsRouter.get('/', verifyAuth, bulkUploadsHandlers.getBulkUploads);

export { bulkUploadsRouter };
