/**
 * This file is loaded by jest, as specified by the integration test jest configuration file
 * via `setupFilesAfterEnv`.
 */
import { db } from '../database';

afterAll(async () => {
  await db.close();
});
