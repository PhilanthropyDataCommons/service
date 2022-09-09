import express from 'express';
import swaggerUi from 'swagger-ui-express';
import documentation from '../openapi.json';
import { isJsonObject } from '../types';

const documentationRouter = express.Router();

documentationRouter.use('/', swaggerUi.serve);
if (isJsonObject(documentation)) {
  documentationRouter.get('/', swaggerUi.setup(documentation));
}

export { documentationRouter };
