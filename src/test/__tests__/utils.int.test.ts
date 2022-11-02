import {
  isoTimestampPattern,
  getTableMetrics,
} from '../utils';
import { db } from '../../database';
import type { Result } from 'tinypg';

describe('test/utils.ts', () => {
  describe('isoTimestampPattern', () => {
    it('Should match valid ISO timestamps', () => {
      expect(isoTimestampPattern.test('2022-10-27T20:16:59.658Z')).toBe(true);
    });

    it('Should not match invalid ISO timestamps', () => {
      expect(isoTimestampPattern.test('hello')).toBe(false);
      expect(isoTimestampPattern.test('2022-10-27')).toBe(false);
    });
  });

  describe('getTableMetrics', () => {
    it('Should reflect metrics properly for an empty table', async () => {
      const metrics = await getTableMetrics('applicants');
      expect(metrics).toMatchObject({
        count: '0',
        maxId: null,
        now: expect.any(Date) as Date,
      });
    });

    it('Should throw an error if no metrics were returned by the database', async () => {
      jest.spyOn(db, 'query')
        .mockImplementationOnce(async () => ({
          rows: [],
        }) as unknown as Result<object>);

      await expect(getTableMetrics('applicants'))
        .rejects
        .toThrow('Something went wrong collecting table metrics for applicants');
    });
  });
});
