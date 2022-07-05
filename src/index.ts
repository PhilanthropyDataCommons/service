import dotenv from 'dotenv';
import express from 'express';

dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? 'localhost';

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(port, () => {
  console.log(`Server running on ${host}:${port}`);
});
