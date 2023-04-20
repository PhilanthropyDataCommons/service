import { db } from '../db';
import { isTableMetrics } from '../../types';
import { InternalValidationError } from '../../errors';
import type { TableMetrics } from '../../types';

export const loadTableMetrics = async (tableName: string): Promise<TableMetrics> => {
  const metricsQueryResult = await db.query<TableMetrics>(`
    SELECT COUNT(id) AS "count",
      MAX(id) AS "maxId",
      NOW() as "now"
    FROM ${tableName};
  `);

  const metrics = metricsQueryResult.rows[0];
  if (metrics === undefined) {
    throw new Error(`Something went wrong collecting table metrics for ${tableName}`);
  }

  if (!isTableMetrics(metrics)) {
    throw new InternalValidationError(
      'The database responded with an unexpected format.',
      isTableMetrics.errors ?? [],
    );
  }

  return metrics;
};
