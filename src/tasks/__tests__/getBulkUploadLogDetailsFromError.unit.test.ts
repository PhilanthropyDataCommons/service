import {
	CYCLE_ERROR_MESSAGE,
	DEFAULT_ERROR_NAME,
	getBulkUploadLogDetailsFromError,
} from '../getBulkUploadLogDetailsFromError';

describe('getBulkUploadLogDetailsFromError', () => {
	it('should present the message of an error when serialized', () => {
		const errorMessage = 'I am JavaScript';
		const error = new Error(errorMessage);
		const usefulError = getBulkUploadLogDetailsFromError(error);
		const usefulErrorSerialized = JSON.stringify(usefulError);
		expect(usefulErrorSerialized.includes('"message":'));
		expect(usefulErrorSerialized.includes(errorMessage));
	});

	it('should return a default error when passed an object with a message', () => {
		const errorMessage = 'I am TypeScript';
		const error = { message: errorMessage };
		const usefulError = getBulkUploadLogDetailsFromError(error);
		expect(usefulError.name).toEqual(DEFAULT_ERROR_NAME);
	});

	it('should have a default message for an object missing a message and no extra properties', () => {
		const error = { randoArray: [] };
		const usefulError = getBulkUploadLogDetailsFromError(error);
		expect(usefulError.message).not.toBeUndefined();
		expect(usefulError.message).not.toBeNull();
		expect(usefulError.name).toEqual(DEFAULT_ERROR_NAME);
		expect(typeof usefulError.message).toEqual('string');
		expect(usefulError.message.length).toBeGreaterThan(0);
		expect(Object.keys(usefulError)).toHaveLength(2);
	});

	it('should return name=DefaultError and a message for a non-object, non-Error argument', () => {
		const notAnError = 'This is not an error nor an object';
		const usefulError = getBulkUploadLogDetailsFromError(notAnError);
		expect(usefulError.message).not.toBeUndefined();
		expect(usefulError.message).not.toBeNull();
		expect(typeof usefulError.message).toEqual('string');
		expect(usefulError.message.length).toBeGreaterThan(0);
		expect(usefulError.name).toEqual(DEFAULT_ERROR_NAME);
	});

	it('should include the cause of the Error when present', () => {
		const originalErrorMessage = 'Originally there was JavaScript';
		const proximateErrorMessage = 'Now there is TypeScript';
		const originalError = new Error(originalErrorMessage);
		const proximateError = new Error(proximateErrorMessage, {
			cause: originalError,
		});
		const usefulError = getBulkUploadLogDetailsFromError(proximateError);
		const usefulErrorSerialized = JSON.stringify(usefulError);
		expect(usefulError.message).toEqual(proximateErrorMessage);
		expect(usefulError).toHaveProperty('cause');
		expect(typeof usefulError.cause).toBe('object');
		expect(usefulErrorSerialized).toContain(originalErrorMessage);
	});

	it('should not include a cause of the Error when no cause is present', () => {
		const errorMessage = 'There is no reason for alarm';
		const error = new Error(errorMessage);
		const usefulError = getBulkUploadLogDetailsFromError(error);
		const usefulErrorSerialized = JSON.stringify(usefulError);
		expect(usefulError.message).toEqual(errorMessage);
		expect(usefulError).not.toHaveProperty('cause');
		expect(usefulErrorSerialized).not.toContain('cause');
	});

	it('should terminate when a loop in the Error cause chain is detected', () => {
		const errorOne = new Error('errorOne', { cause: new Error() });
		const errorTwo = new Error('errorTwo', { cause: errorOne });
		const errorThree = new Error('errorThree', { cause: errorTwo });
		errorOne.cause = errorThree;
		const usefulError = getBulkUploadLogDetailsFromError(errorThree);
		// Stringify throws an error when a cycle still exists in `usefulError`
		const usefulErrorSerialized = JSON.stringify(usefulError);
		expect(usefulErrorSerialized).toContain(errorOne.message);
		expect(usefulErrorSerialized).toContain(errorTwo.message);
		expect(usefulErrorSerialized).toContain(errorThree.message);
		expect(usefulErrorSerialized).toContain(CYCLE_ERROR_MESSAGE);
	});
});
