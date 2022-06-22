import path from 'path';
import { TinyPg } from 'tinypg';
import { migrate as pgMigrate } from 'postgres-migrations';

export const db = new TinyPg({
  root_dir: [path.resolve(__dirname, 'queries')],
});

export const migrate = async (): Promise<void> => {
  const client = await db.getClient();
  await pgMigrate(
    { client },
    path.resolve(__dirname, 'migrations'),
  );
};
