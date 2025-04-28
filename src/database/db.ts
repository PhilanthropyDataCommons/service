import path from 'path';
import fs from 'fs/promises';
import { TinyPg } from 'tinypg';
import { getLogger } from '../logger';

const initializationDirectory = path.join(__dirname, 'initialization');
const logger = getLogger('db');

const db = new TinyPg({
	root_dir: [path.resolve(__dirname, 'queries')],
});

db.pool.on('connect', (client) => {
	client.query("SET TIME ZONE 'UTC';").catch((err: unknown) => {
		logger.error({ err }, 'Failed to set timezone');
	});
});

const initializeDatabase = async () => {
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
};

export { initializeDatabase, db };
