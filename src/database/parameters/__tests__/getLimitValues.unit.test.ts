import {
  getLimitValues,
} from '..';
import {
  InternalValidationError,
} from '../../../errors';

describe('getLimitValues', () => {
  it('should return calculated values when valid parameters are provided', () => {
    const limitValues = getLimitValues({
      count: 5,
      page: 2,
    });
    expect(limitValues).toEqual({
      limit: 5,
      offset: 5,
    });
  });

  it('should error if count is a float value', () => {
    expect(() => getLimitValues({
      count: 100.5,
      page: 42,
    })).toThrow(InternalValidationError);
  });

  it('should error if count is less than 1', () => {
    expect(() => getLimitValues({
      count: 0,
      page: 42,
    })).toThrow(InternalValidationError);
  });

  it('should error if page is less than 1', () => {
    expect(() => getLimitValues({
      count: 100,
      page: 0,
    })).toThrow(InternalValidationError);
  });

  it('should error if page is a float vlaue', () => {
    expect(() => getLimitValues({
      count: 100,
      page: 42.5,
    })).toThrow(InternalValidationError);
  });
});
