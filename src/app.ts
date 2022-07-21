import express from 'express';
import pinoHttp from 'pino-http';
import { rootRouter } from './routers';
import { logger } from './logger';

const app = express();
app.use(pinoHttp({
  logger,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', rootRouter);

export { app };
