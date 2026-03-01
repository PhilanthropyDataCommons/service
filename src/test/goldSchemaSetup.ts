/**
 * Gold Schema Setup for Integration Tests
 *
 * This module handles the lifecycle of the "gold" schema used to speed up
 * integration tests. Instead of running ~79 migrations before each test,
 * we run migrations once into a gold schema and clone it for each test.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { TinyPg } from 'tinypg';
import { migrate as pgMigrate } from 'postgres-schema-migrations';
import { requireEnv } from 'require-env-variable';
import type { PoolClient } from 'pg';

// Use a unique name unlikely to appear in SQL code to avoid replacement collisions
export const GOLD_SCHEMA_NAME = '__pdc_test_gold_schema__';

const migrationsDirectory = path.resolve(__dirname, '../database/migrations');
const initializationDirectory = path.resolve(
	__dirname,
	'../database/initialization',
);

// Directory for temporary test schema dumps
// Stored in project root, should be gitignored
export const TEST_TEMP_DIR = path.resolve(__dirname, '../../.test_dumps');

// File path to cache the schema dump (shared across processes)
export const SCHEMA_DUMP_CACHE_FILE = path.join(
	TEST_TEMP_DIR,
	'gold_schema_dump.sql',
);

const execAsync = promisify(exec);

/**
 * Creates a dedicated TinyPg instance for gold schema setup.
 * This is separate from the main db instance to avoid PGOPTIONS interference.
 */
const createDb = (): TinyPg =>
	new TinyPg({
		root_dir: [path.resolve(__dirname, '../database/queries')],
	});

/**
 * Sets PostgreSQL configuration variables needed during migrations.
 * Must use the same client that will run migrations so settings are available.
 */
const setPsqlSettingsForMigrations = async (
	client: PoolClient,
): Promise<void> => {
	const { S3_ENDPOINT, S3_BUCKET, S3_REGION } = requireEnv(
		'S3_ENDPOINT',
		'S3_BUCKET',
		'S3_REGION',
	);

	await client.query('SELECT set_config($1, $2, false)', [
		'app.s3_endpoint',
		S3_ENDPOINT,
	]);
	await client.query('SELECT set_config($1, $2, false)', [
		'app.s3_bucket',
		S3_BUCKET,
	]);
	await client.query('SELECT set_config($1, $2, false)', [
		'app.s3_region',
		S3_REGION,
	]);
};

/**
 * Runs initialization SQL files from src/database/initialization/ against the gold schema.
 * Uses a single client to ensure search_path is consistent across all queries.
 */
const runInitialization = async (
	db: TinyPg,
	schemaName: string,
): Promise<void> => {
	const initializationFiles = (
		await fs.readdir(initializationDirectory)
	).filter((file) => file.endsWith('.sql'));

	// Pre-read all SQL files
	const sqlContents = await Promise.all(
		initializationFiles.map(async (file) => {
			const filePath = path.join(initializationDirectory, file);
			return (await fs.readFile(filePath)).toString();
		}),
	);

	// Use a single client for all initialization to maintain search_path
	// Execute sequentially to ensure proper ordering
	const client = await db.getClient();
	try {
		await client.query(`SET search_path TO ${schemaName}`);

		for (const sql of sqlContents) {
			// eslint-disable-next-line no-await-in-loop -- Sequential execution required for DB consistency
			await client.query(sql);
		}
	} finally {
		client.release();
	}
};

/**
 * Dumps the gold schema directly to the cache file using pg_dump.
 * Pipes directly to file to avoid memory buffering of large dumps.
 */
const dumpGoldSchemaToFile = async (): Promise<void> => {
	// pg_dump reads connection info from PG* environment variables automatically
	// Options to minimize dump size:
	// --no-owner, --no-privileges: skip ownership/permissions
	// --no-comments: skip comments
	// --inserts: use INSERT instead of COPY (needed for schema name replacement)
	// Pipe directly to file to avoid memory buffering
	await execAsync(
		`pg_dump --schema=${GOLD_SCHEMA_NAME} --no-owner --no-privileges --no-comments --inserts > "${SCHEMA_DUMP_CACHE_FILE}"`,
	);
};

/**
 * Cleans up orphaned functions left behind by interrupted test runs.
 * These orphans occur when test processes are killed mid-execution,
 * leaving functions that reference non-existent schemas.
 * This prevents pg_dump from failing with "schema with OID X does not exist".
 */
const cleanupOrphanedFunctions = async (db: TinyPg): Promise<void> => {
	// Find and remove functions whose namespace no longer exists
	// This is a defensive cleanup for any orphans from previous interrupted runs
	await db.query(`
		DO $$
		DECLARE
			r RECORD;
		BEGIN
			FOR r IN
				SELECT p.oid
				FROM pg_proc p
				LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
				WHERE n.oid IS NULL
			LOOP
				DELETE FROM pg_depend WHERE objid = r.oid;
				DELETE FROM pg_proc WHERE oid = r.oid;
			END LOOP;
		END $$
	`);
};

/**
 * Creates the gold schema with all migrations and initialization applied.
 * This should be called once before all integration tests run.
 */
export const createGoldSchema = async (): Promise<void> => {
	const db = createDb();

	try {
		// Clean up any orphaned functions from previous interrupted test runs
		// This prevents pg_dump from failing due to stale references
		await cleanupOrphanedFunctions(db);

		// Drop existing gold schema if present (cleanup from crashed previous run)
		await db.query(`DROP SCHEMA IF EXISTS ${GOLD_SCHEMA_NAME} CASCADE`);

		// Create gold schema
		await db.query(`CREATE SCHEMA ${GOLD_SCHEMA_NAME}`);

		// Run migrations against the gold schema
		// Use a single client for S3 settings and migrations so settings are available
		const client = await db.getClient();
		try {
			await setPsqlSettingsForMigrations(client);
			// Set search_path so migrations create tables in the gold schema
			await client.query(`SET search_path TO ${GOLD_SCHEMA_NAME}`);
			await pgMigrate({ client }, migrationsDirectory, {
				logger: () => {
					// Silent during test setup
				},
				schema: GOLD_SCHEMA_NAME,
			});
		} finally {
			client.release();
		}

		// Run initialization SQL files (functions, views, etc.)
		await runInitialization(db, GOLD_SCHEMA_NAME);

		// Ensure the test temp directory exists
		await fs.mkdir(TEST_TEMP_DIR, { recursive: true });

		// Cache the schema dump to a file for cloning (shared across processes)
		await dumpGoldSchemaToFile();
	} finally {
		await db.close();
	}
};

/**
 * Generates the path for a worker-specific dump file.
 */
export const getWorkerDumpFilePath = (workerId: number): string =>
	path.join(TEST_TEMP_DIR, `test_${workerId}_dump.sql`);

const FIRST_WORKER_ID = 1;

/**
 * Creates worker-specific dump files by replacing the gold schema name.
 * Should be called during global setup after createGoldSchema.
 *
 * @param maxWorkers - The maximum number of Jest workers (from config)
 */
export const createWorkerDumpFiles = async (
	maxWorkers: number,
): Promise<void> => {
	// Create dump files for each worker (worker IDs are 1-indexed in Jest)
	const workerIds = Array.from(
		{ length: maxWorkers },
		(_, i) => i + FIRST_WORKER_ID,
	);

	await Promise.all(
		workerIds.map(async (workerId) => {
			const workerDumpFile = getWorkerDumpFilePath(workerId);
			const targetSchema = `test_${workerId}`;
			// Use sed for fast string replacement
			await execAsync(
				`sed 's/${GOLD_SCHEMA_NAME}/${targetSchema}/g' "${SCHEMA_DUMP_CACHE_FILE}" > "${workerDumpFile}"`,
			);
		}),
	);
};

/**
 * Drops the gold schema.
 * This should be called after all integration tests complete.
 */
export const dropGoldSchema = async (): Promise<void> => {
	const db = createDb();

	try {
		await db.query(`DROP SCHEMA IF EXISTS ${GOLD_SCHEMA_NAME} CASCADE`);
		// Clean up the cached schema dump file
		try {
			await fs.unlink(SCHEMA_DUMP_CACHE_FILE);
		} catch (_error) {
			// File may not exist, ignore
		}
	} finally {
		await db.close();
	}
};

/**
 * Drops all worker test schemas (test_1, test_2, etc.).
 * This is used during cleanup to ensure no worker schemas are left behind.
 *
 * @param maxWorkers - The maximum number of workers to clean up
 */
export const dropWorkerSchemas = async (maxWorkers: number): Promise<void> => {
	const db = createDb();

	try {
		const workerIds = Array.from(
			{ length: maxWorkers },
			(_, i) => i + FIRST_WORKER_ID,
		);

		await Promise.all(
			workerIds.map(async (workerId) => {
				const schemaName = `test_${workerId}`;
				await db.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
			}),
		);
	} finally {
		await db.close();
	}
};
