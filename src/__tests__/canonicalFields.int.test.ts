import request from 'supertest';
import { app } from '../app';
import {
  prepareDatabaseForCurrentWorker,
  cleanupDatabaseForCurrentWorker,
} from '../test/harnessFunctions';

const agent = request.agent(app);

describe('/canonicalFields', () => {
  describe('/', () => {
    it('should return HTTP Status Code 200 OK', async () => {
      await prepareDatabaseForCurrentWorker();
      await agent
        .get('/canonicalFields')
        .expect(200);
      await cleanupDatabaseForCurrentWorker();
    });
  });
});
