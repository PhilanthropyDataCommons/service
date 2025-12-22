import { coerceQuery } from '../coerceQuery';

describe('coerceQuery', () => {
	test('coerces array values', () => {
		const query = { ids: ['1', '2', '3'] };
		const result = coerceQuery(query);
		expect(result.ids).toEqual([1, 2, 3]);
	});

	test('skips undefined values', () => {
		const query = { foo: 'bar', baz: undefined };
		const result = coerceQuery(query);
		expect(result).toEqual({ foo: 'bar' });
		expect(result.baz).toBeUndefined();
	});

	test('handles empty query object', () => {
		const query = {};
		const result = coerceQuery(query);
		expect(result).toEqual({});
	});

	test('coerces multiple query params with different types including arrays', () => {
		const query = {
			page: '1',
			count: '10',
			search: 'test',
			active: 'true',
			ids: ['1', '2', '3'],
		};
		const result = coerceQuery(query);
		expect(result).toEqual({
			page: 1,
			count: 10,
			search: 'test',
			active: true,
			ids: [1, 2, 3],
		});
	});
});
