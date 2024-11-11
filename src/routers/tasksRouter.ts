import express from 'express';
import { bulkUploadTasksHandlers } from '../handlers/bulkUploadTasksHandlers';
import { requireAuthentication } from '../middleware';

const tasksRouter = express.Router();

tasksRouter.post(
	'/bulkUploads',
	requireAuthentication,
	bulkUploadTasksHandlers.postBulkUploadTask,
);

tasksRouter.get(
	'/bulkUploads',
	requireAuthentication,
	bulkUploadTasksHandlers.getBulkUploadTasks,
);

export { tasksRouter };
