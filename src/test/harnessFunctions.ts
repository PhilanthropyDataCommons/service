import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { db } from '../database';
import { getWorkerDumpFilePath } from './goldSchemaSetup';

const execAsync = promisify(exec);

const getWorkerIdForCurrentTest = (): number => {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error(
			'You cannot get a test worker ID outside of a test environment.',
		);
	}
	if (process.env.JEST_WORKER_ID === undefined) {
		throw new Error(
			'You cannot get a test worker ID if jest has not specified a worker ID.',
		);
	}
	return parseInt(process.env.JEST_WORKER_ID, 10);
};

const generateSchemaName = (workerId: number): string => `test_${workerId}`;

const setSchemaForCurrentPoolConnection = async (
	schemaName: string,
): Promise<void> => {
	await db.query(`SET search_path TO ${schemaName};`);
};

const setSchemaForFuturePoolConnections = (schemaName: string): void => {
	process.env.PGOPTIONS = `-c search_path=${schemaName}`;
};

const setSchema = async (schemaName: string): Promise<void> => {
	await setSchemaForCurrentPoolConnection(schemaName);
	setSchemaForFuturePoolConnections(schemaName);
};

const dropSchema = async (schemaName: string): Promise<void> => {
	await db.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`);
};

/**
 * Restores a test schema from the pre-created worker dump file.
 * The dump file is created during global setup with the correct schema name.
 */
const restoreSchemaFromDump = async (workerId: number): Promise<void> => {
	const workerDumpFile = getWorkerDumpFilePath(workerId);

	// Execute via psql -f for fast execution directly from file
	// psql reads connection info from PG* environment variables
	await execAsync(`psql -f "${workerDumpFile}"`);
};

export const prepareDatabaseForCurrentWorker = async (): Promise<void> => {
	const workerId = getWorkerIdForCurrentTest();
	const schemaName = generateSchemaName(workerId);

	// Drop any existing schema (cleanup from failed previous test)
	await dropSchema(schemaName);

	// Restore schema from pre-created worker dump file
	await restoreSchemaFromDump(workerId);

	// Set search path to the new test schema
	await setSchema(schemaName);
};

export const cleanupDatabaseForCurrentWorker = async (): Promise<void> => {
	const workerId = getWorkerIdForCurrentTest();
	const schemaName = generateSchemaName(workerId);
	await dropSchema(schemaName);
};
