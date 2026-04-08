import {
	closeDatabase,
	createAndSetDatabase,
	getDatabaseName,
	initializeDatabase,
} from './database';
import { TEST_DATABASE_PREFIX } from './constants';
import { app } from './app';
import { startJobQueue } from './jobQueue';
import { getLogger } from './logger';
import { loadConfig } from './config';

const logger = getLogger(__filename);
const DEFAULT_PORT = 3001;

const port = Number(process.env.PORT ?? DEFAULT_PORT);
const host = process.env.HOST ?? 'localhost';

const start = async (): Promise<void> => {
	try {
		const db = createAndSetDatabase();
		const dbName = await getDatabaseName(db);
		if (dbName.startsWith(TEST_DATABASE_PREFIX)) {
			throw new Error(
				`Connected to database "${dbName}" which starts with test prefix ` +
					`"${TEST_DATABASE_PREFIX}". Refusing to start to avoid ` +
					`operating on a test database.`,
			);
		}
		await initializeDatabase(db);
	} catch (err) {
		logger.error(err, 'Database failed to initialize');
		await closeDatabase().catch((closeErr: unknown) => {
			logger.error(closeErr, 'Failed to close database during error cleanup');
		});
		throw err;
	}
	try {
		await startJobQueue();
	} catch (err) {
		logger.error(err, 'Job queue failed to start');
		throw err;
	}
	try {
		await loadConfig();
	} catch (err) {
		logger.error(err, 'Configuration failed to load');
		throw err;
	}
	app.listen(port, host, () => {
		const mode = process.env.NODE_ENV === 'production' ? 'production' : 'debug';
		logger.info(`Server running on http://${host}:${port} in ${mode} mode`);
	});
};

start().catch(() => {
	logger.error(
		'The PDC service was not started. Please check the logs for more information.',
	);
});
