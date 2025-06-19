import { db } from '../../db';
import { isTableMetrics } from '../../../types';
import { InternalValidationError } from '../../../errors';
import type { TableMetrics } from '../../../types';

export const loadTableMetrics = async (
	tableName: string,
): Promise<TableMetrics> => {
	const metricsQueryResult = await db.query<TableMetrics>(`
    SELECT COUNT(*) AS "count",
      NOW() as "now"
    FROM ${tableName};
  `);

	const {
		rows: [metrics],
	} = metricsQueryResult;
	if (metrics === undefined) {
		throw new Error(
			`Something went wrong collecting table metrics for ${tableName}`,
		);
	}

	if (!isTableMetrics(metrics)) {
		throw new InternalValidationError(
			'The database responded with an unexpected format.',
			isTableMetrics.errors ?? [],
		);
	}

	return metrics;
};
