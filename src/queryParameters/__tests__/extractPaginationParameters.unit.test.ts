import {
  extractPaginationParameters,
} from '..';
import {
  InputValidationError,
} from '../../errors';
import apiSpecification from '../../openapi.json';

describe('extractPaginationParameters', () => {
  it('should return default values according to documented defaults', () => {
    const paginationParameters = extractPaginationParameters({
      query: {},
    });
    expect(paginationParameters).toEqual({
      page: apiSpecification.components.parameters.pageParam.schema.default,
      count: apiSpecification.components.parameters.countParam.schema.default,
    });
  });

  it('should override default values when provided', () => {
    const paginationParameters = extractPaginationParameters({
      query: {
        _page: '42',
        _count: '7',
      },
    });
    expect(paginationParameters).toEqual({
      page: 42,
      count: 7,
    });
  });

  it('should throw an error when strings that parse to NaN are provided', () => {
    expect(() => extractPaginationParameters({
      query: {
        _page: 'forty two',
        _count: 'banana',
      },
    })).toThrow(InputValidationError);
  });

  it('should throw an error when strings that parse to floats are provided', () => {
    expect(() => extractPaginationParameters({
      query: {
        _page: '42.6',
        _count: '7.7',
      },
    })).toThrow(InputValidationError);
  });
});
