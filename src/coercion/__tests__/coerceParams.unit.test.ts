import { coerceParams } from '../coerceParams';

describe('coerceParams', () => {
	test('coerces "true" string to boolean true', () => {
		const params = { flag: 'true' };
		const result = coerceParams(params);
		expect(result.flag).toBe(true);
	});

	test('coerces "false" string to boolean false', () => {
		const params = { flag: 'false' };
		const result = coerceParams(params);
		expect(result.flag).toBe(false);
	});

	test('coerces integer string to number', () => {
		const params = { id: '123' };
		const result = coerceParams(params);
		expect(result.id).toBe(123);
	});

	test('coerces decimal string to number', () => {
		const params = { value: '123.45' };
		const result = coerceParams(params);
		expect(result.value).toBe(123.45);
	});

	test('coerces negative number string to number', () => {
		const params = { value: '-42' };
		const result = coerceParams(params);
		expect(result.value).toBe(-42);
	});

	test('coerces zero string to number', () => {
		const params = { value: '0' };
		const result = coerceParams(params);
		expect(result.value).toBe(0);
	});

	test('preserves non-numeric strings', () => {
		const params = { name: 'john' };
		const result = coerceParams(params);
		expect(result.name).toBe('john');
	});

	test('preserves strings that are not "true" or "false"', () => {
		const params = { status: 'active' };
		const result = coerceParams(params);
		expect(result.status).toBe('active');
	});

	test('preserves mixed alphanumeric strings', () => {
		const params = { code: 'abc123' };
		const result = coerceParams(params);
		expect(result.code).toBe('abc123');
	});

	test('handles empty params object', () => {
		const params = {};
		const result = coerceParams(params);
		expect(result).toEqual({});
	});

	test('does not coerce NaN strings to numbers', () => {
		const params = { value: 'NaN' };
		const result = coerceParams(params);
		expect(result.value).toBe('NaN');
	});

	test('does not coerce Infinity strings to numbers', () => {
		const params = { value: 'Infinity' };
		const result = coerceParams(params);
		expect(result.value).toBe('Infinity');
	});

	test('preserves empty strings', () => {
		const params = { value: '' };
		const result = coerceParams(params);
		expect(result.value).toBe('');
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
