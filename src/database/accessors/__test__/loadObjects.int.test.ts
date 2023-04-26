import { loadObjects } from '..';
import { db } from '../..';

describe('loadObjects', () => {
  it('Should return objects provided by the database', async () => {
    await db.sql('applicants.insertOne', {
      externalId: '12345',
      optedIn: true,
    });
    const objects = await loadObjects(
      'applicants.selectAll',
      {},
    );
    expect(objects).toMatchObject([{
      createdAt: expect.any(Date) as Date,
      externalId: '12345',
      id: 1,
      optedIn: true,
    }]);
  });
});
