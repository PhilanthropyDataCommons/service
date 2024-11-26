import path from 'path';
import fs from 'fs/promises';
import { TinyPg } from 'tinypg';
import { getLogger } from '../logger';

const initializationDirectory = path.join(__dirname, 'initialization');

const db = new TinyPg({
	root_dir: [path.resolve(__dirname, 'queries')],
});

const initializeDatabase = async () => {
	const logger = getLogger('initializeDatabase');
	const initializationFiles = (
		await fs.readdir(initializationDirectory)
	).filter((file) => file.endsWith('.sql'));

	await Promise.all(
		initializationFiles.map(async (file) => {
			const filePath = path.join(initializationDirectory, file);
			logger.debug({ filePath }, 'Running SQL file');
			const sql = (await fs.readFile(filePath)).toString();
			await db.query(sql);
		}),
	);
};

export { initializeDatabase, db };
