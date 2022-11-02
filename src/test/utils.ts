import { db } from '../database';

export const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

interface TableMetrics {
  count: number;
  maxId: number;
  now: Date;
}
export const getTableMetrics = async (tableWithId: string): Promise<TableMetrics> => {
  const metricsQueryResult = await db.query<TableMetrics>(`
    SELECT COUNT(id) AS "count",
      MAX(id) AS "maxId",
      NOW() as "now"
    FROM ${tableWithId};
  `);

  const metrics = metricsQueryResult.rows[0];
  if (metrics === undefined) {
    throw new Error(`Something went wrong collecting table metrics for ${tableWithId}`);
  }
  return metrics;
};
