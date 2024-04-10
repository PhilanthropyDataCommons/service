import path from 'path';
import express from 'express';
import pinoHttp from 'pino-http';
import cors from 'cors';
import { rootRouter } from './routers';
import { errorHandler, processJwt, addUserContext } from './middleware';
import { getLogger } from './logger';

const logger = getLogger(__filename);
const app = express();
app.use(cors());
app.use(processJwt);
app.use(addUserContext);
app.use(
	pinoHttp({
		logger,
	}),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/', rootRouter);
app.use(errorHandler);

export { app };
