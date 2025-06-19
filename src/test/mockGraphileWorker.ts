import { jobQueueLogger } from '../jobQueue';
import type { JobHelpers } from 'graphile-worker';

export const getMockJobHelpers = (): JobHelpers =>
	// This is a mock response object for use in tests, we only need
	// to mock the aspects of JobHelpers that we use in our code base.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	({
		logger: jobQueueLogger,
	}) as unknown as JobHelpers;
