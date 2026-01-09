import express from 'express';
import { changemakerFieldValuesHandlers } from '../handlers/changemakerFieldValuesHandlers';
import { requireAuthentication } from '../middleware';

const changemakerFieldValuesRouter = express.Router();

changemakerFieldValuesRouter.get(
	'/',
	requireAuthentication,
	changemakerFieldValuesHandlers.getChangemakerFieldValues,
);

changemakerFieldValuesRouter.get(
	'/:fieldValueId',
	requireAuthentication,
	changemakerFieldValuesHandlers.getChangemakerFieldValue,
);

changemakerFieldValuesRouter.post(
	'/',
	requireAuthentication,
	changemakerFieldValuesHandlers.postChangemakerFieldValue,
);

export { changemakerFieldValuesRouter };
