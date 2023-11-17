import path from 'path';
import { migrate as pgMigrate } from 'postgres-schema-migrations';
import { db } from './db';

export const migrate = async (schema = 'public'): Promise<void> => {
  const client = await db.getClient();
  try {
    await pgMigrate(
      { client },
      path.resolve(__dirname, 'migrations'),
      { schema },
    );
  } finally {
    client.release();
  }
};
