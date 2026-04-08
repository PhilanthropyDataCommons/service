/* eslint-disable import/no-default-export --
 * Jest expects a single default function to be exported from this file.
 */
import {
	assertTestDatabaseName,
	createTestAdminClient,
	GOLD_DATABASE_NAME,
} from './testDatabase';

export default async (): Promise<void> => {
	assertTestDatabaseName(GOLD_DATABASE_NAME);
	const adminClient = createTestAdminClient();
	await adminClient.connect();
	await adminClient.query(`DROP DATABASE IF EXISTS ${GOLD_DATABASE_NAME}`);
	await adminClient.end();
};
