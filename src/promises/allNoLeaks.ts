// Inspired by https://stackoverflow.com/questions/64928212/how-to-use-promise-allsettled-with-typescript#69451755
const isRejected = (result: PromiseSettledResult<unknown>) =>
	result.status === 'rejected';
const isFulfilled = <T>(result: PromiseSettledResult<T>) =>
	result.status === 'fulfilled';

const getErrorFromReason = (reason: unknown): Error => {
	if (reason instanceof Error) {
		return reason;
	}
	return new Error(
		`An unexpected error occurred while awaiting all tasks: ${JSON.stringify(reason)}`,
	);
};

/**
 * Returns results of given `Promise`s or throws an `Error` if any `Promise` rejects.
 * `Promise.all` has a simple API but it leaks execution after one `Promise` rejects.
 * `Promise.allSettled` does not leak execution but its API is awkward.
 * Here we offer a simplified `Promise.all`-like API wrapping `Promise.allSettled` functionality.
 * Use this function in place of `Promise.all` in almost all circumstances.
 */
export const allNoLeaks = async <T>(values: Promise<T>[]) => {
	const settled = await Promise.allSettled(values);
	const rejectedTask = settled.find(isRejected);
	if (rejectedTask !== undefined) {
		throw getErrorFromReason(rejectedTask.reason);
	}
	return settled.filter(isFulfilled)?.map((e) => e.value);
};
