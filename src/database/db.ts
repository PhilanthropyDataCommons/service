import path from 'path';
import fs from 'fs/promises';
import { TinyPg } from 'tinypg';

const initializationDirectory = path.join(__dirname, 'initialization');

const db = new TinyPg({
	root_dir: [path.resolve(__dirname, 'queries')],
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
