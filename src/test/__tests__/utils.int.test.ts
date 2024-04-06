import { isoTimestampPattern, generateNextWithAssertions } from '../utils';

describe('test/utils.ts', () => {
	describe('isoTimestampPattern', () => {
		it('Should match valid ISO timestamps', () => {
			expect(isoTimestampPattern.test('2022-10-27T20:16:59.658Z')).toBe(true);
		});

		it('Should not match invalid ISO timestamps', () => {
			expect(isoTimestampPattern.test('hello')).toBe(false);
			expect(isoTimestampPattern.test('2022-10-27')).toBe(false);
		});
	});

	describe('generateNextWithAssertions', () => {
		it('Should properly call `done` if an error is thrown mid-test', (done) => {
			const errorToThrow = new Error(
				'This error happened when running assertions',
			);
			const mockedDone = jest.fn((err) => {
				try {
					expect(err).toBe(errorToThrow);
				} finally {
					done();
				}
			}) as unknown as jest.DoneCallback;
			const runAssertions = async () => {
				throw errorToThrow;
			};
			const mockedNext = generateNextWithAssertions(runAssertions, mockedDone);
			mockedNext();
		});

		it('Should properly call `done` if expectations pass', (done) => {
			const mockedDone = jest.fn((err) => {
				try {
					expect(err).toBe(undefined);
				} finally {
					done(err);
				}
			}) as unknown as jest.DoneCallback;
			const runAssertions = async () => {
				expect(true).toBe(true);
			};
			const mockedNext = generateNextWithAssertions(runAssertions, mockedDone);
			mockedNext();
		});

		it('Should properly call `done` with an error if expectations fail', (done) => {
			const mockedDone = jest.fn((err) => {
				try {
					expect(err).not.toBe(undefined);
					expect(err).toBeInstanceOf(Error);
				} finally {
					done();
				}
			}) as unknown as jest.DoneCallback;
			const runAssertions = async () => {
				expect(true).toBe(false);
			};
			const mockedNext = generateNextWithAssertions(runAssertions, mockedDone);
			mockedNext();
		});
	});
});
