import type { BulkUploadLogDetails } from '../types';

export const CYCLE_ERROR_MESSAGE =
	'A cycle was detected in the error cause chain.';

export const DEFAULT_ERROR_NAME = 'DefaultError';

/**
 * Convert a thrown into a serializable object with a `message` string.
 * Strictly limits information to `name`, `message`, and `cause`.
 * Strictly requires an `Error` and `cause` to be error to get details.
 * Yet loosely allows anything and will provide a default in those cases.
 * @param err A thrown thing, most usefully an instance of Error.
 * @param previouslySeenErrors A Set of previously seen throwns to break cycles
 * @returns A serializable object with at least a `message` property
 */
export const getBulkUploadLogDetailsFromError = (
	err: unknown,
	previouslySeenErrors: Set<unknown> = new Set(),
): BulkUploadLogDetails => {
	if (previouslySeenErrors.has(err)) return { message: CYCLE_ERROR_MESSAGE };
	/** Defensive copy of previouslySeenObjects to avoid mutating args */
	const seenErrors = new Set(previouslySeenErrors);
	seenErrors.add(err);
	if (err instanceof Error) {
		if (err.cause !== undefined && err.cause !== null) {
			return {
				message: err.message,
				name: err.name,
				cause: getBulkUploadLogDetailsFromError(err.cause, seenErrors),
			};
		}
		return {
			message: err.message,
			name: err.name,
		};
	}
	return {
		name: DEFAULT_ERROR_NAME,
		message: `Received an unexpected type ${typeof err}`,
	};
};
