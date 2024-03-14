import { db } from '../../db';
import { loadTableMetrics } from './loadTableMetrics';
import type { TinyPgParams } from 'tinypg';
import type { Bundle } from '../../../types';

export const loadBundle = async <T extends object>(
	tinyPgQueryName: string,
	tinyPgQueryParameters: TinyPgParams,
	tableName: string,
): Promise<Bundle<T>> => {
	const result = await db.sql<T>(tinyPgQueryName, tinyPgQueryParameters);
	const metrics = await loadTableMetrics(tableName);

	return {
		entries: result.rows,
		total: metrics.count,
	};
};
