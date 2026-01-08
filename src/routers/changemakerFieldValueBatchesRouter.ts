import express from 'express';
import { changemakerFieldValueBatchesHandlers } from '../handlers/changemakerFieldValueBatchesHandlers';
import { requireAuthentication } from '../middleware';

const changemakerFieldValueBatchesRouter = express.Router();

changemakerFieldValueBatchesRouter.get(
	'/',
	requireAuthentication,
	changemakerFieldValueBatchesHandlers.getChangemakerFieldValueBatches,
);

changemakerFieldValueBatchesRouter.get(
	'/:batchId',
	requireAuthentication,
	changemakerFieldValueBatchesHandlers.getChangemakerFieldValueBatch,
);

changemakerFieldValueBatchesRouter.post(
	'/',
	requireAuthentication,
	changemakerFieldValueBatchesHandlers.postChangemakerFieldValueBatch,
);

export { changemakerFieldValueBatchesRouter };
