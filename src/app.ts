import express from 'express';
import PinoHttp from 'pino-http';
import { rootRouter } from './routers';

const app = express();
app.use(PinoHttp());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', rootRouter);

export { app };
