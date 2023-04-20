import {
  isoTimestampPattern,
} from '../utils';

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
});
