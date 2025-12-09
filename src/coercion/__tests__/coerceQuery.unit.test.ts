import { coerceQuery } from '../coerceQuery';

describe('coerceQuery', () => {
	test('coerces "true" string to boolean true', () => {
		const query = { flag: 'true' };
		const result = coerceQuery(query);
		expect(result.flag).toBe(true);
	});

	test('coerces "false" string to boolean false', () => {
		const query = { flag: 'false' };
		const result = coerceQuery(query);
		expect(result.flag).toBe(false);
	});

	test('coerces integer string to number', () => {
		const query = { page: '5' };
		const result = coerceQuery(query);
		expect(result.page).toBe(5);
	});

	test('coerces decimal string to number', () => {
		const query = { rating: '4.5' };
		const result = coerceQuery(query);
		expect(result.rating).toBe(4.5);
	});

	test('coerces negative number string to number', () => {
		const query = { offset: '-10' };
		const result = coerceQuery(query);
		expect(result.offset).toBe(-10);
	});

	test('preserves non-numeric strings', () => {
		const query = { search: 'hello world' };
		const result = coerceQuery(query);
		expect(result.search).toBe('hello world');
	});

	test('coerces array of numeric strings to numbers', () => {
		const query = { ids: ['1', '2', '3'] };
		const result = coerceQuery(query);
		expect(result.ids).toEqual([1, 2, 3]);
	});

	test('coerces array of boolean strings to booleans', () => {
		const query = { flags: ['true', 'false', 'true'] };
		const result = coerceQuery(query);
		expect(result.flags).toEqual([true, false, true]);
	});

	test('preserves array of non-numeric strings', () => {
		const query = { tags: ['foo', 'bar', 'baz'] };
		const result = coerceQuery(query);
		expect(result.tags).toEqual(['foo', 'bar', 'baz']);
	});

	test('coerces array with mixed types', () => {
		const query = { values: ['123', 'true', 'hello', '45.6'] };
		const result = coerceQuery(query);
		expect(result.values).toEqual([123, true, 'hello', 45.6]);
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

	test('does not coerce NaN strings to numbers', () => {
		const query = { value: 'NaN' };
		const result = coerceQuery(query);
		expect(result.value).toBe('NaN');
	});

	test('does not coerce Infinity strings to numbers', () => {
		const query = { value: 'Infinity' };
		const result = coerceQuery(query);
		expect(result.value).toBe('Infinity');
	});

	test('preserves empty strings', () => {
		const query = { value: '' };
		const result = coerceQuery(query);
		expect(result.value).toBe('');
	});

	test('coerces multiple query params with different types', () => {
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

	test('handles zero string', () => {
		const query = { offset: '0' };
		const result = coerceQuery(query);
		expect(result.offset).toBe(0);
	});

	test('handles array with zero string', () => {
		const query = { values: ['0', '1', '2'] };
		const result = coerceQuery(query);
		expect(result.values).toEqual([0, 1, 2]);
	});
});
