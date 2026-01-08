/* eslint-disable import/no-default-export --
 * Jest expects a single default function to be exported from this file.
 */
import os from 'node:os';
import { createGoldSchema, createWorkerDumpFiles } from './goldSchemaSetup';
import type { Config } from 'jest';

const DEFAULT_MAX_WORKERS = 4;
const MIN_WORKERS = 1;
const PERCENTAGE_DIVISOR = 100;
// Cap workers to prevent PostgreSQL "out of shared memory" errors from too many concurrent schemas
const MAX_INTEGRATION_WORKERS = 8;

/**
 * Determines the number of workers Jest will use.
 * Jest's maxWorkers can be a number or a percentage string like "50%".
 */
const getMaxWorkers = (globalConfig: Config): number => {
	const { maxWorkers } = globalConfig;

	if (typeof maxWorkers === 'number') {
		return maxWorkers;
	}

	if (typeof maxWorkers === 'string' && maxWorkers.endsWith('%')) {
		const percentage = parseInt(maxWorkers, 10);
		const { length: cpuCount } = os.cpus();
		return Math.max(
			MIN_WORKERS,
			Math.floor((cpuCount * percentage) / PERCENTAGE_DIVISOR),
		);
	}

	// Default fallback
	return DEFAULT_MAX_WORKERS;
};

/**
 * Global setup for integration tests.
 * Runs once before all integration tests start.
 *
 * 1. Sets LOG_LEVEL to silent if running in silent mode
 * 2. Creates the gold schema with migrations and initialization
 * 3. Creates worker-specific dump files for all workers
 */
export default async (
	globalConfig: Config,
	projectConfig: Config,
): Promise<void> => {
	// Set log level (replicated from base globalSetup.ts)
	if (
		(process.env.LOG_LEVEL === undefined || process.env.LOG_LEVEL === '') &&
		(globalConfig.silent === true || projectConfig.silent === true)
	) {
		process.env.LOG_LEVEL = 'silent';
	}

	// Create the gold schema with all migrations applied
	await createGoldSchema();

	// Create worker-specific dump files for all workers (capped to prevent DB overload)
	const maxWorkers = Math.min(
		getMaxWorkers(globalConfig),
		MAX_INTEGRATION_WORKERS,
	);
	await createWorkerDumpFiles(maxWorkers);
};
