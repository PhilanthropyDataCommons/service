import express from 'express';
import { bulkUploadsHandlers } from '../handlers/bulkUploadsHandlers';
import { requireAuthentication } from '../middleware';

const bulkUploadsRouter = express.Router();

bulkUploadsRouter.post(
	'/',
	requireAuthentication,
	bulkUploadsHandlers.postBulkUpload,
);

bulkUploadsRouter.get(
	'/',
	requireAuthentication,
	bulkUploadsHandlers.getBulkUploads,
);

export { bulkUploadsRouter };
