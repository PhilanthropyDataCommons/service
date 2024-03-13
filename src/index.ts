import { initializeDatabase } from './database';
import { app } from './app';
import { startJobQueue } from './jobQueue';
import { getLogger } from './logger';

const logger = getLogger(__filename);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? 'localhost';

const start = async () => {
	try {
		await initializeDatabase();
	} catch (err) {
		logger.error(err, 'Database failed to initialize');
		throw err;
	}
	try {
		await startJobQueue();
	} catch (err) {
		logger.error(err, 'Job queue failed to start');
		throw err;
	}
	app.listen(port, host, () => {
		logger.info(`Server running on http://${host}:${port}`);
	});
};

start().catch(() => {
	logger.error(
		'The PDC service was not started. Please check the logs for more information.',
	);
});
