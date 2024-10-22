/* istanbul ignore file */
import { jobQueueLogger } from '../jobQueue';
import type { JobHelpers } from 'graphile-worker';

export const getMockJobHelpers = (): JobHelpers =>
	({
		logger: jobQueueLogger,
	}) as JobHelpers;
