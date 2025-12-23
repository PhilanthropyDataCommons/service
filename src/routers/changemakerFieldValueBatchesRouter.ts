import express from 'express';
import { changemakerFieldValueBatchesHandlers } from '../handlers/changemakerFieldValueBatchesHandlers';
import { requireAuthentication } from '../middleware';

const changemakerFieldValueBatchesRouter = express.Router();

changemakerFieldValueBatchesRouter.post(
	'/',
	requireAuthentication,
	changemakerFieldValueBatchesHandlers.postChangemakerFieldValueBatch,
);

export { changemakerFieldValueBatchesRouter };
