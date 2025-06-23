import { fail } from 'assert';
import { allNoLeaks } from '../allNoLeaks';

describe('allNoLeaks', () => {
	it('should throw an error after companion long-duration `Promise` completes', async () => {
		let longTaskCompleted = false;
		const longTask = new Promise<void>((resolve) => {
			setTimeout(() => {
				longTaskCompleted = true;
				resolve();
			}, 50);
		});
		const errorMessageToThrow = "errored, y'all!";
		const errorTask = Promise.reject(new Error(errorMessageToThrow));
		try {
			// Substitute `Promise.all` here and the test fails, demonstrating the purpose of allNoLeaks.
			await allNoLeaks([longTask, errorTask]);
			fail('Expected an error to be thrown');
		} catch (error) {
			expect(longTaskCompleted).toBe(true);
			expect(error).toEqual(new Error(errorMessageToThrow));
		}
	});

	it('should throw an error with object reason', async () => {
		const errorReasonToThrow = { weird: 'object' };

		/* eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors --
		 * The point is to test handling of non-error rejections.
		 */
		const errorTask = Promise.reject(errorReasonToThrow);
		try {
			await allNoLeaks([errorTask]);
			fail('Expected an error to be thrown');
		} catch (error) {
			expect(error).toEqual(
				new Error(
					'An unexpected error occurred while awaiting all tasks: {"weird":"object"}',
				),
			);
		}
	});

	it('should throw an error with array reason', async () => {
		const errorReasonToThrow = [2025, 5, 8];

		/* eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors --
		 * The point is to test handling of non-error rejections.
		 */
		const errorTask = Promise.reject(errorReasonToThrow);
		try {
			await allNoLeaks([errorTask]);
			fail('Expected an error to be thrown');
		} catch (error) {
			expect(error).toEqual(
				new Error(
					'An unexpected error occurred while awaiting all tasks: [2025,5,8]',
				),
			);
		}
	});

	it('should throw an error with string reason', async () => {
		const errorReasonToThrow = 'I am a string';

		/* eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors --
		 * The point is to test handling of non-error rejections.
		 */
		const errorTask = Promise.reject(errorReasonToThrow);
		try {
			await allNoLeaks([errorTask]);
			fail('Expected an error to be thrown');
		} catch (error) {
			expect(error).toEqual(
				new Error(
					'An unexpected error occurred while awaiting all tasks: "I am a string"',
				),
			);
		}
	});
});
