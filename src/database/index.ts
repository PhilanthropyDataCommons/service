import path from 'path';
import { TinyPg } from 'tinypg';
import { migrate as pgMigrate } from 'postgres-migrations';

const HOST: string = process.env.PGHOST ?? 'localhost';
const USER: string = process.env.PGUSER ?? 'pdc';
const PASS: string = process.env.PGPASS ?? 'pdc';
const PORT: string = process.env.PGPORT ?? '5432';
const DB: string = process.env.PGDATABASE ?? 'pdc';

export const db = new TinyPg({
  root_dir: [path.resolve(__dirname, 'queries')],
  connection_string:
    `postgres://${USER}:${PASS}@${HOST}:${PORT}/${DB}`,
});

export const migrate = async (): Promise<void> => {
  const client = await db.getClient();
  await pgMigrate(
    { client },
    path.resolve(__dirname, 'migrations'),
  );
};
