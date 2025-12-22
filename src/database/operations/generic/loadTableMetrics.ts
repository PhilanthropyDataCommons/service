import { db } from '../../db';
import { isTableMetrics } from '../../../types';
import { InternalValidationError } from '../../../errors';
import type { TableMetrics } from '../../../types';

interface RawTableMetrics {
	count: string;
	now: string;
}

export const loadTableMetrics = async (
	tableName: string,
): Promise<TableMetrics> => {
	const metricsQueryResult = await db.query<RawTableMetrics>(`
    SELECT COUNT(*) AS "count",
      NOW() as "now"
    FROM ${tableName};
  `);

	const {
		rows: [rawMetrics],
	} = metricsQueryResult;
	if (rawMetrics === undefined) {
		throw new Error(
			`Something went wrong collecting table metrics for ${tableName}`,
		);
	}

	const metrics = {
		count: Number(rawMetrics.count),
		now: new Date(rawMetrics.now),
	};

	if (!isTableMetrics(metrics)) {
		throw new InternalValidationError(
			'The database responded with an unexpected format.',
			isTableMetrics.errors ?? [],
		);
	}

	return metrics;
};
