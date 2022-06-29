import express from 'express';
import { rootRouter } from './routers';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', rootRouter);

export { app };
