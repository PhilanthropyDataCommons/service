import type { Request, Response } from 'express';

/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
 * This is a mock object for use in tests, and we only need
 * to mock an implementation for the aspects used in our tests.
 */
const getMockRequest = (): Request => ({}) as unknown as Request;

const getMockResponse = (): Response =>
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
	 * This is a mock object for use in tests, and we only need
	 * to mock an implementation for the aspects used in our tests.
	 */
	({
		type: jest.fn(),
		set: jest.fn(),
		send: jest.fn(),
	}) as unknown as Response;

export { getMockRequest, getMockResponse };
