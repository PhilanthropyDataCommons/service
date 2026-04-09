import nock from 'nock';
/**
 * This file is loaded by jest, as specified by the integration test jest configuration file
 * via `setupFilesAfterEnv`.
 */
import { loadConfig } from '../config';
import { resetTestPermissionGrantFactory } from './factories';
import {
	closeAdminClient,
	createWorkerDatabase,
	destroyWorkerDatabase,
	initializeWorker,
} from './harnessFunctions';
import { mockJwks } from './mockJwt';

// This mock prevents graphile-worker from running background jobs during tests.
jest.mock('graphile-worker');

beforeAll(async () => {
	await initializeWorker();
});

afterAll(async () => {
	await closeAdminClient();
});

beforeEach(async () => {
	resetTestPermissionGrantFactory();
	mockJwks.start();
	await createWorkerDatabase();
	await loadConfig();
});

afterEach(async () => {
	await destroyWorkerDatabase();
	jest.restoreAllMocks();
	mockJwks.stop();
	nock.cleanAll();
});
