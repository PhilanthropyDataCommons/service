import dotenv from 'dotenv';
import { app } from './app';

dotenv.config();

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? 'localhost';

app.listen(
  port,
  host,
  () => {
    console.log(`Server running on ${host}:${port}`);
  },
);
