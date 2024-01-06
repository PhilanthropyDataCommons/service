import apiSpecification from '../openapi.json';

describe('openapi.json', () => {
	describe('page parameter', () => {
		it('should have a non-negative default value', () => {
			expect(
				apiSpecification.components.parameters.pageParam.schema.default,
			).toBeGreaterThanOrEqual(1);
		});

		it('should have an integer default value', () => {
			const integerValue = Math.floor(
				apiSpecification.components.parameters.pageParam.schema.default,
			);
			expect(integerValue).toEqual(
				apiSpecification.components.parameters.pageParam.schema.default,
			);
		});
	});

	describe('count parameter', () => {
		it('should have a non-negative default value', () => {
			expect(
				apiSpecification.components.parameters.countParam.schema.default,
			).toBeGreaterThanOrEqual(1);
		});

		it('should have an integer default value', () => {
			const integerValue = Math.floor(
				apiSpecification.components.parameters.countParam.schema.default,
			);
			expect(integerValue).toEqual(
				apiSpecification.components.parameters.countParam.schema.default,
			);
		});
	});
});
