import path from 'node:path';
import fs from 'node:fs/promises';
import { TinyPg } from 'tinypg';
import { getLogger } from '../logger';

const initializationDirectory = path.join(__dirname, 'initialization');
const logger = getLogger('db');

let db: TinyPg | null = null;

const getDatabase = (): TinyPg => {
	if (db === null) {
		throw new Error(
			'Database has not been initialized. Call setDatabase() first.',
		);
	}
	return db;
};

const createAndSetDatabase = (connectionString?: string): TinyPg => {
	const newDb = createDatabase(connectionString);
	db = newDb;
	return newDb;
};

const closeDatabase = async (): Promise<void> => {
	const current = db;
	if (current !== null) {
		db = null;
		await current.close();
	}
};

const createDatabase = (connectionString?: string): TinyPg => {
	const newDb = new TinyPg({
		root_dir: [path.resolve(__dirname, 'queries')],
		...(connectionString === undefined
			? {}
			: { connection_string: connectionString }),
	});

	newDb.pool.on('connect', (client) => {
		client.query("SET TIME ZONE 'UTC';").catch((err: unknown) => {
			logger.error({ err }, 'Failed to set timezone');
		});
	});

	return newDb;
};

const getDatabaseName = async (db: TinyPg): Promise<string> => {
	const { rows } = await db.query<{ current_database: string }>(
		'SELECT current_database()',
	);
	const [row] = rows;
	return row?.current_database ?? '';
};

const initializeDatabase = async (db: TinyPg): Promise<TinyPg> => {
	const initializationFiles = (await fs.readdir(initializationDirectory))
		.filter((file) => file.endsWith('.sql'))
		// Numeric-aware so a leading prefix compares as a number (2_ before 10_),
		// not lexically.
		.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

	// Files are created one at a time in this order, so a lower numeric prefix
	// controls load order: a function written in LANGUAGE sql can reference a
	// function an earlier file creates. Body validation stays on, so a bad
	// reference fails loudly at startup.
	await initializationFiles.reduce(async (previous, file) => {
		await previous;
		const filePath = path.join(initializationDirectory, file);
		await db.query((await fs.readFile(filePath)).toString());
	}, Promise.resolve());

	return db;
};

export {
	closeDatabase,
	createAndSetDatabase,
	createDatabase,
	getDatabase,
	getDatabaseName,
	initializeDatabase,
};
