import express from 'express';
import { changemakerFieldValuesHandlers } from '../handlers/changemakerFieldValuesHandlers';
import { requireAuthentication } from '../middleware';

const changemakerFieldValuesRouter = express.Router();

changemakerFieldValuesRouter.post(
	'/',
	requireAuthentication,
	changemakerFieldValuesHandlers.postChangemakerFieldValue,
);

export { changemakerFieldValuesRouter };
