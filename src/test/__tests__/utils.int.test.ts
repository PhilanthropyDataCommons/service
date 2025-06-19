import { generateNextWithAssertions } from '../utils';

describe('test/utils.ts', () => {
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
			});
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
			});
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
			});
			const runAssertions = async () => {
				expect(true).toBe(false);
			};
			const mockedNext = generateNextWithAssertions(runAssertions, mockedDone);
			mockedNext();
		});
	});
});
