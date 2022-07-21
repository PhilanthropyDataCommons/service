import request from 'supertest';
import { app } from '../app';

const agent = request.agent(app);

describe('/canonicalFields', () => {
  describe('/', () => {
    it('should return HTTP Status Code 200 OK', async () => {
      await agent
        .get('/canonicalFields')
        .expect(200);
    });
  });
});
