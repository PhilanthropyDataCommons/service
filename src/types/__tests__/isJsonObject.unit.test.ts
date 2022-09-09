import { isJsonObject } from '..';

describe('isJsonObject', () => {
  it('should return false in the null case', () => {
    expect(isJsonObject(null)).toBe(false);
  });

  it('should return false in the number case', () => {
    expect(isJsonObject(42)).toBe(false);
  });

  it('should return true for empty objects', () => {
    expect(isJsonObject({})).toBe(true);
  });

  it('should return true for populated objects', () => {
    expect(isJsonObject({
      foo: 15,
    })).toBe(true);
  });
});
