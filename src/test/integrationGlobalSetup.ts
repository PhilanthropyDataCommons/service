/* eslint-disable import/no-default-export --
 * Jest expects a single default function to be exported from this file.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import {
	EXIT_CODE_FAILURE,
	EXIT_CODE_SIGINT,
	EXIT_CODE_SIGTERM,
} from '../constants';
import {
	createGoldSchema,
	createWorkerDumpFiles,
	dropGoldSchema,
	dropWorkerSchemas,
	TEST_TEMP_DIR,
} from './goldSchemaSetup';
import type { Config } from 'jest';

const DEFAULT_MAX_WORKERS = 4;
const MIN_WORKERS = 1;
const PERCENTAGE_DIVISOR = 100;
// Cap workers to prevent PostgreSQL "out of shared memory" errors from too many concurrent schemas
const MAX_INTEGRATION_WORKERS = 8;

// Track the number of workers for cleanup during signal handling
let registeredMaxWorkers = DEFAULT_MAX_WORKERS;

/**
 * Performs emergency cleanup when tests are interrupted.
 * Drops all test schemas and cleans up temporary files.
 */
const performEmergencyCleanup = async (): Promise<void> => {
	// Use process.stderr.write to avoid any logging framework issues during shutdown
	process.stderr.write('\nInterrupted - cleaning up test schemas...\n');

	try {
		await dropGoldSchema();
		await dropWorkerSchemas(registeredMaxWorkers);
		await fs.rm(TEST_TEMP_DIR, { recursive: true, force: true });
		process.stderr.write('Cleanup complete.\n');
	} catch (error) {
		process.stderr.write(`Cleanup error: ${String(error)}\n`);
	}
};

/**
 * Signal handler for SIGINT (Ctrl+C) and SIGTERM.
 * Performs cleanup before exiting.
 */
const handleSignal = (signal: string): void => {
	process.stderr.write(`\nReceived ${signal}.\n`);

	// Remove handlers to prevent re-entry
	process.removeListener('SIGINT', handleSignal);
	process.removeListener('SIGTERM', handleSignal);

	performEmergencyCleanup()
		.finally(() => {
			const exitCode =
				signal === 'SIGINT' ? EXIT_CODE_SIGINT : EXIT_CODE_SIGTERM;
			process.exit(exitCode);
		})
		.catch(() => {
			// Fallback exit if something goes wrong
			process.exit(EXIT_CODE_FAILURE);
		});
};

/**
 * Registers signal handlers for graceful shutdown.
 */
const registerSignalHandlers = (): void => {
	process.on('SIGINT', () => {
		handleSignal('SIGINT');
	});
	process.on('SIGTERM', () => {
		handleSignal('SIGTERM');
	});
};

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
 * 1. Registers signal handlers for graceful shutdown on interrupt
 * 2. Sets LOG_LEVEL to silent if running in silent mode
 * 3. Creates the gold schema with migrations and initialization
 * 4. Creates worker-specific dump files for all workers
 */
export default async (
	globalConfig: Config,
	projectConfig: Config,
): Promise<void> => {
	// Register signal handlers early so cleanup runs even if setup is interrupted
	registerSignalHandlers();

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

	// Store maxWorkers for signal handler cleanup
	registeredMaxWorkers = maxWorkers;

	await createWorkerDumpFiles(maxWorkers);
};
