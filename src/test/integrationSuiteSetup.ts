/**
 * This file is loaded by jest, as specified by the integration test jest configuration file
 * via `setupFilesAfterEnv`.
 */
import { db } from '../database';
import {
  prepareDatabaseForCurrentWorker,
  cleanupDatabaseForCurrentWorker,
} from './harnessFunctions';
import { mockJwks } from './mockJwt';

beforeAll(async () => {
  mockJwks.start();
});

afterAll(async () => {
  mockJwks.stop();
  await db.close();
});

beforeEach(async () => {
  await prepareDatabaseForCurrentWorker();
});

afterEach(async () => {
  await cleanupDatabaseForCurrentWorker();
  jest.restoreAllMocks();
});
