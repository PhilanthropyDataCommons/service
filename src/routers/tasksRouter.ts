import express from 'express';
import { bulkUploadTasksHandlers } from '../handlers/bulkUploadTasksHandlers';
import { baseFieldsCopyTasksHandlers } from '../handlers/baseFieldsCopyTasksHandlers';
import { requireAdministratorRole, requireAuthentication } from '../middleware';

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

tasksRouter.post(
	'/baseFieldsCopy',
	requireAdministratorRole,
	baseFieldsCopyTasksHandlers.postBaseFieldsCopyTask,
);

tasksRouter.get(
	'/baseFieldsCopy',
	requireAdministratorRole,
	baseFieldsCopyTasksHandlers.getBaseFieldsCopyTasks,
);

export { tasksRouter };
