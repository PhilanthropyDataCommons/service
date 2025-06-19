import { ISO_TIMESTAMP_PATTERN } from '../time';

describe('constants/time', () => {
	describe('ISO_TIMESTAMP_PATTERN', () => {
		it('Should match valid ISO timestamps', () => {
			expect(ISO_TIMESTAMP_PATTERN.test('2022-10-27T20:16:59.658Z')).toBe(true);
		});

		it('Should not match invalid ISO timestamps', () => {
			expect(ISO_TIMESTAMP_PATTERN.test('hello')).toBe(false);
			expect(ISO_TIMESTAMP_PATTERN.test('2022-10-27')).toBe(false);
		});
	});
});
