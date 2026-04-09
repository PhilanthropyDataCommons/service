import { closeDatabase, createAndSetDatabase } from '../database';
import { TEST_DATABASE_PREFIX } from '../constants';
import {
	assertTestDatabaseName,
	createTestAdminClient,
	getTestPgConfig,
	GOLD_DATABASE_NAME,
} from './testDatabase';
import type { Client } from 'pg';

const buildConnectionString = (database: string): string => {
	const config = getTestPgConfig();
	const user = encodeURIComponent(config.user);
	const password = encodeURIComponent(config.password);
	return `postgresql://${user}:${password}@${config.host}:${config.port}/${database}`;
};

const getWorkerDatabaseName = (): string => {
	const {
		env: { JEST_WORKER_ID },
	} = process;
	if (JEST_WORKER_ID === undefined || JEST_WORKER_ID === '') {
		throw new Error(
			'JEST_WORKER_ID is not set. This function must be called within a Jest worker.',
		);
	}
	return `${TEST_DATABASE_PREFIX}_worker_${JEST_WORKER_ID}`;
};

let adminClient: Client | null = null;

const initializeWorker = async (): Promise<void> => {
	adminClient = createTestAdminClient();
	await adminClient.connect();
};

const createWorkerDatabase = async (): Promise<void> => {
	if (adminClient === null) {
		throw new Error(
			'Admin client not initialized. Call initializeWorker first.',
		);
	}
	const workerDbName = getWorkerDatabaseName();
	assertTestDatabaseName(workerDbName);
	await adminClient.query(`DROP DATABASE IF EXISTS ${workerDbName}`);
	await adminClient.query(
		`CREATE DATABASE ${workerDbName} TEMPLATE ${GOLD_DATABASE_NAME}`,
	);
	const connectionString = buildConnectionString(workerDbName);
	createAndSetDatabase(connectionString);
};

const destroyWorkerDatabase = async (): Promise<void> => {
	if (adminClient === null) {
		throw new Error(
			'Admin client not initialized. Call initializeWorker first.',
		);
	}
	await closeDatabase();
	const workerDbName = getWorkerDatabaseName();
	assertTestDatabaseName(workerDbName);
	await adminClient.query(`DROP DATABASE IF EXISTS ${workerDbName}`);
};

const closeAdminClient = async (): Promise<void> => {
	const client = adminClient;
	if (client !== null) {
		adminClient = null;
		await client.end();
	}
};

export {
	buildConnectionString,
	closeAdminClient,
	createWorkerDatabase,
	destroyWorkerDatabase,
	initializeWorker,
};
