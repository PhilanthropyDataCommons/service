import { loadObjects } from '..';
import {
  isApplicant,
  isProposal,
} from '../../../../types';
import { InternalValidationError } from '../../../../errors';
import { db } from '../../..';

describe('loadObjects', () => {
  it('Should return objects provided by the database', async () => {
    await db.sql('applicants.insertOne', {
      externalId: '12345',
      optedIn: true,
    });
    const objects = await loadObjects(
      'applicants.selectAll',
      {},
      isApplicant,
    );
    expect(objects).toMatchObject([{
      createdAt: expect.any(Date) as Date,
      externalId: '12345',
      id: 1,
      optedIn: true,
    }]);
  });

  it('Should throw an error if the format returned by the database does not align with the expected schema', async () => {
    await db.sql('applicants.insertOne', {
      externalId: '12345',
      optedIn: true,
    });
    await expect(loadObjects(
      'applicants.selectAll',
      {},
      isProposal,
    )).rejects.toBeInstanceOf(InternalValidationError);
  });
});
