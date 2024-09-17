import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type { CheckResult } from '../../../types';

export const assertSourceExists = async (sourceId: number): Promise<void> => {
	const result = await db.sql<CheckResult>('sources.checkExistsById', {
		sourceId,
	});

	if (result.rows[0]?.result !== true) {
		throw new NotFoundError(`Entity not found`, {
			entityType: 'Source',
			entityId: sourceId,
		});
	}
};
