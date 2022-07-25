import path from 'path';
import { migrate as pgMigrate } from 'postgres-migrations';
import { db } from './db';

export const migrate = async (): Promise<void> => {
  const client = await db.getClient();
  try {
    await pgMigrate(
      { client },
      path.resolve(__dirname, 'migrations'),
    );
  } finally {
    client.release();
  }
};
