import apiSpecification from '../openapi.json';

describe('openapi.json', () => {
  describe('page parameter', () => {
    it('should have a non-negative default value', () => {
      expect(apiSpecification.parameters.pageParam.default).toBeGreaterThanOrEqual(1);
    });

    it('should have an integer default value', () => {
      const integerValue = Math.floor(apiSpecification.parameters.pageParam.default);
      expect(integerValue).toEqual(apiSpecification.parameters.pageParam.default);
    });
  });

  describe('count parameter', () => {
    it('should have a non-negative default value', () => {
      expect(apiSpecification.parameters.countParam.default).toBeGreaterThanOrEqual(1);
    });

    it('should have an integer default value', () => {
      const integerValue = Math.floor(apiSpecification.parameters.countParam.default);
      expect(integerValue).toEqual(apiSpecification.parameters.countParam.default);
    });
  });
});
