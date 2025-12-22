import { coerceString, coerceStrings } from '../coerceString';

describe('coerceString', () => {
	describe('boolean coercion', () => {
		test('coerces "true" string to boolean true', () => {
			expect(coerceString('true')).toBe(true);
		});

		test('coerces "false" string to boolean false', () => {
			expect(coerceString('false')).toBe(false);
		});
	});

	describe('number coercion', () => {
		test('coerces integer string to number', () => {
			expect(coerceString('123')).toBe(123);
		});

		test('coerces decimal string to number', () => {
			expect(coerceString('123.45')).toBe(123.45);
		});

		test('coerces negative number string to number', () => {
			expect(coerceString('-42')).toBe(-42);
		});

		test('coerces zero string to number', () => {
			expect(coerceString('0')).toBe(0);
		});

		test('does not coerce NaN strings to numbers', () => {
			expect(coerceString('NaN')).toBe('NaN');
		});

		test('does not coerce Infinity strings to numbers', () => {
			expect(coerceString('Infinity')).toBe('Infinity');
		});
	});

	describe('string preservation', () => {
		test('preserves non-numeric strings', () => {
			expect(coerceString('hello')).toBe('hello');
		});

		test('preserves mixed alphanumeric strings', () => {
			expect(coerceString('abc123')).toBe('abc123');
		});

		test('preserves empty strings', () => {
			expect(coerceString('')).toBe('');
		});
	});
});

describe('coerceStrings', () => {
	test('coerces array of numeric strings to numbers', () => {
		expect(coerceStrings(['1', '2', '3'])).toEqual([1, 2, 3]);
	});

	test('coerces array of boolean strings to booleans', () => {
		expect(coerceStrings(['true', 'false', 'true'])).toEqual([
			true,
			false,
			true,
		]);
	});

	test('preserves array of non-numeric strings', () => {
		expect(coerceStrings(['foo', 'bar', 'baz'])).toEqual(['foo', 'bar', 'baz']);
	});

	test('coerces array with mixed types', () => {
		expect(coerceStrings(['123', 'true', 'hello', '45.6'])).toEqual([
			123,
			true,
			'hello',
			45.6,
		]);
	});

	test('handles array with zero string', () => {
		expect(coerceStrings(['0', '1', '2'])).toEqual([0, 1, 2]);
	});

	test('handles empty array', () => {
		expect(coerceStrings([])).toEqual([]);
	});
});
