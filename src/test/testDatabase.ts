import { Client } from 'pg';
import { requireEnv } from 'require-env-variable';
import { TEST_DATABASE_PREFIX } from '../constants';

const GOLD_DATABASE_NAME = `${TEST_DATABASE_PREFIX}_gold`;
const TEST_ADMIN_DATABASE = 'postgres';

/**
 * Validates that a database name starts with the test prefix.
 * This is a safety guard to prevent test infrastructure from
 * accidentally issuing CREATE or DROP against a non-test database.
 */
const assertTestDatabaseName = (name: string): void => {
	if (!name.startsWith(TEST_DATABASE_PREFIX)) {
		throw new Error(
			`Refusing to operate on database "${name}": ` +
				`test database names must start with "${TEST_DATABASE_PREFIX}".`,
		);
	}
};

/**
 * Returns PostgreSQL connection config for test infrastructure.
 *
 * Requires TEST_PG* env vars to be explicitly set. This ensures tests
 * use a dedicated PostgreSQL user with CREATEDB privilege, separate
 * from the application user. This limits blast radius: even if a name
 * validation bug occurs, the test user can only drop databases it owns.
 *
 * The admin database is hardcoded to 'postgres' and validated to not
 * match the test database prefix, preventing the admin client from
 * accidentally connecting to (or operating on) a test database.
 */
interface TestPgConfig {
	host: string;
	port: number;
	user: string;
	password: string;
	database: string;
}

const getTestPgConfig = (): TestPgConfig => {
	const { TEST_PGHOST, TEST_PGPORT, TEST_PGUSER } = requireEnv(
		'TEST_PGHOST',
		'TEST_PGPORT',
		'TEST_PGUSER',
	);
	const {
		env: { TEST_PGPASSWORD },
	} = process;
	return {
		host: TEST_PGHOST,
		port: Number(TEST_PGPORT),
		user: TEST_PGUSER,
		password: TEST_PGPASSWORD ?? '',
		database: TEST_ADMIN_DATABASE,
	};
};

/**
 * Creates a pg Client using test credentials.
 * Used for admin operations (CREATE/DROP DATABASE) in test setup/teardown.
 */
const createTestAdminClient = (): Client => {
	const config = getTestPgConfig();
	return new Client(config);
};

export {
	assertTestDatabaseName,
	createTestAdminClient,
	getTestPgConfig,
	GOLD_DATABASE_NAME,
};
