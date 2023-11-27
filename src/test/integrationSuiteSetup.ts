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

// This mock prevents our queue manager from actually being invoked.
// It's necessary because of the way we leverage PGOPTIONS to specify
// the schema / search path when preparing the test worker to interact
// with specific schemas.
//
// We may eventually want to be able to write tests that interact with the queue
// and we may eventually face issues with blunt mocking of graphile-worker.
// When that happens, we'll need to remove this mock and change the way we're
// setting the schema / path.
jest.mock('graphile-worker');

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
