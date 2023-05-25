import {
  loadTableMetrics,
} from '..';
import { db } from '../..';
import type { Result } from 'tinypg';

describe('loadTableMetrics', () => {
  it('Should reflect metrics properly for an empty table', async () => {
    const metrics = await loadTableMetrics('applicants');
    expect(metrics).toMatchObject({
      count: 0,
      now: expect.any(Date) as Date,
    });
  });

  it('Should throw an error if no metrics were returned by the database', async () => {
    jest.spyOn(db, 'query')
      .mockImplementationOnce(async () => ({
        rows: [],
      }) as unknown as Result<object>);

    await expect(loadTableMetrics('applicants'))
      .rejects
      .toThrow('Something went wrong collecting table metrics for applicants');
  });
});
