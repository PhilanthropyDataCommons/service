/* eslint-disable import/no-default-export --
 * Jest expects a single default function to be exported from this file.
 */
import fs from 'node:fs/promises';
import { dropGoldSchema, TEST_TEMP_DIR } from './goldSchemaSetup';

/**
 * Removes the .test directory and all its contents.
 */
const cleanupTestTempDir = async (): Promise<void> => {
	try {
		await fs.rm(TEST_TEMP_DIR, { recursive: true, force: true });
	} catch {
		// Directory may not exist, ignore
	}
};

/**
 * Global teardown for integration tests.
 * Runs once after all integration tests complete.
 *
 * Drops the gold schema and cleans up the .test directory.
 */
export default async (): Promise<void> => {
	await dropGoldSchema();
	await cleanupTestTempDir();
};
