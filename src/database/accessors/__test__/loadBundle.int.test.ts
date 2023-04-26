import { loadBundle } from '..';
import { db } from '../..';

describe('loadBundle', () => {
  it('Should return a bundle for the query', async () => {
    await db.sql('applicants.insertOne', {
      externalId: '12345',
      optedIn: true,
    });
    const objects = await loadBundle(
      'applicants.selectAll',
      {},
      'applicants',
    );
    expect(objects).toMatchObject({
      total: 1,
      entries: [{
        createdAt: expect.any(Date) as Date,
        externalId: '12345',
        id: 1,
        optedIn: true,
      }],
    });
  });
});
