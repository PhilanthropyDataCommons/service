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
	const initializationFiles = (
		await fs.readdir(initializationDirectory)
	).filter((file) => file.endsWith('.sql'));

	await Promise.all(
		initializationFiles.map(async (file) => {
			const filePath = path.join(initializationDirectory, file);
			const sql = (await fs.readFile(filePath)).toString();
			await db.query(sql);
		}),
	);

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
