/* This file might look silly, but it's because jest has typed `expect.any(...)` as
 * returning `any` which our linting does not (and should not) allow.
 *
 * These helpers allow us to map that to `unknown` which is type safe and also
 * greatly pleases the linter.
 */
import { ISO_TIMESTAMP_PATTERN } from '../constants';

const expectArray = (): unknown => expect.any(Array);

const expectArrayContaining = (arr: unknown[]): unknown =>
	expect.arrayContaining(arr);

const expectDate = (): unknown => expect.any(Date);

const expectNumber = (): unknown => expect.any(Number);

const expectObject = (): unknown => expect.any(Object);

const expectObjectContaining = (obj: Record<string, unknown>): unknown =>
	expect.objectContaining(obj);

const expectString = (): unknown => expect.any(String);

const expectTimestamp = (): unknown =>
	expect.stringMatching(ISO_TIMESTAMP_PATTERN);

export {
	expectArray,
	expectArrayContaining,
	expectDate,
	expectNumber,
	expectObject,
	expectObjectContaining,
	expectString,
	expectTimestamp,
};
