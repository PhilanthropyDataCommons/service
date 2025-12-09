import { coerceParams } from '../coerceParams';

describe('coerceParams', () => {
	test('handles empty params object', () => {
		const params = {};
		const result = coerceParams(params);
		expect(result).toEqual({});
	});

	test('coerces multiple params with different types', () => {
		const params = {
			id: '123',
			name: 'test',
			active: 'true',
			count: '42',
		};
		const result = coerceParams(params);
		expect(result).toEqual({
			id: 123,
			name: 'test',
			active: true,
			count: 42,
		});
	});
});
