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

const setDatabase = (newDb: TinyPg): void => {
	db = newDb;
};

const createDatabase = (): TinyPg => {
	const newDb = new TinyPg({
		root_dir: [path.resolve(__dirname, 'queries')],
	});

	newDb.pool.on('connect', (client) => {
		client.query("SET TIME ZONE 'UTC';").catch((err: unknown) => {
			logger.error({ err }, 'Failed to set timezone');
		});
	});

	return newDb;
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

export { createDatabase, initializeDatabase, setDatabase, getDatabase };
