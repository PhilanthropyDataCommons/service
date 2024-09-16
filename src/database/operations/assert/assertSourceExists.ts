import { db } from '../../db';
import { InputConflictError } from '../../../errors';
import type { CheckResult } from '../../../types';

export const assertSourceExists = async (sourceId: number): Promise<void> => {
	const result = await db.sql<CheckResult>('sources.checkExistsById', {
		sourceId,
	});

	if (result.rows[0]?.result !== true) {
		throw new InputConflictError('The source was not found', {
			entityType: 'Source',
			entityId: sourceId,
		});
	}
};
