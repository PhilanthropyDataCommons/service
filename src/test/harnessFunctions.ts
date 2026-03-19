import {
	createDatabase,
	getDatabase,
	initializeDatabase,
	migrate,
	setDatabase,
} from '../database';
import type { TinyPg } from 'tinypg';

const generateSchemaName = (workerId: string): string => `test_${workerId}`;

const getSchemaNameForCurrentTestWorker = (): string => {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error(
			'You cannot get a test schema name outside of a test environment.',
		);
	}
	if (process.env.JEST_WORKER_ID === undefined) {
		throw new Error(
			'You cannot get a test schema name if jest has not specified a worker ID.',
		);
	}
	return generateSchemaName(process.env.JEST_WORKER_ID);
};

const createSchema = async (db: TinyPg, schemaName: string): Promise<void> => {
	await db.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`);
};

const setSchemaForCurrentPoolConnection = async (
	db: TinyPg,
	schemaName: string,
): Promise<void> => {
	await db.query(`SET search_path TO ${schemaName};`);
};

const setSchemaForFuturePoolConnections = (schemaName: string): void => {
	process.env.PGOPTIONS = `-c search_path=${schemaName}`;
};

const setSchema = async (db: TinyPg, schemaName: string): Promise<void> => {
	await setSchemaForCurrentPoolConnection(db, schemaName);
	setSchemaForFuturePoolConnections(schemaName);
};

const dropSchema = async (db: TinyPg, schemaName: string): Promise<void> => {
	await db.query(`DROP SCHEMA ${schemaName} CASCADE;`);
};

export const createAndSetDatabase = (): void => {
	const db = createDatabase();
	setDatabase(db);
};

export const prepareDatabaseForCurrentWorker = async (): Promise<void> => {
	const db = getDatabase();
	const schemaName = getSchemaNameForCurrentTestWorker();
	await createSchema(db, schemaName);
	await setSchema(db, schemaName);
	await migrate(db, schemaName);
	await initializeDatabase(db);
};

export const cleanupDatabaseForCurrentWorker = async (): Promise<void> => {
	const schemaName = getSchemaNameForCurrentTestWorker();
	await dropSchema(getDatabase(), schemaName);
};
