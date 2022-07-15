import {
  db,
  migrate,
} from '../database';

const generateSchemaName = (workerId: string): string => `test_${workerId}`;

const getSchemaNameForCurrentTestWorker = (): string => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('You cannot get a test schema name outside of a test environment.');
  }
  if (process.env.JEST_WORKER_ID === undefined) {
    throw new Error('You cannot get a test schema name if jest has not specified a worker ID.');
  }
  return generateSchemaName(process.env.JEST_WORKER_ID);
};

const createSchema = async (schemaName: string): Promise<void> => {
  await db.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`);
};

const setSchema = async (schemaName: string): Promise<void> => {
  await db.query(`SET search_path TO ${schemaName};`);
};

const dropSchema = async (schemaName: string): Promise<void> => {
  await db.query(`DROP SCHEMA ${schemaName} CASCADE;`);
};

export const prepareDatabaseForCurrentWorker = async (): Promise<void> => {
  const schemaName = getSchemaNameForCurrentTestWorker();
  await createSchema(schemaName);
  await setSchema(schemaName);
  await migrate();
};

export const cleanupDatabaseForCurrentWorker = async (): Promise<void> => {
  const schemaName = getSchemaNameForCurrentTestWorker();
  await dropSchema(schemaName);
};
