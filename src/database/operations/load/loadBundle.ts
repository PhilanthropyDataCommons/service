import { loadTableMetrics } from './loadTableMetrics';
import { loadObjects } from './loadObjects';
import type { TinyPgParams } from 'tinypg';
import type { ValidateFunction } from 'ajv';
import type {
  Bundle,
} from '../../../types';

export const loadBundle = async <T extends object>(
  tinyPgQueryName: string,
  tinyPgQueryParameters: TinyPgParams,
  tableName: string,
  entryValidator: ValidateFunction<T>,
): Promise<Bundle<T>> => {
  const entries = await loadObjects(
    tinyPgQueryName,
    tinyPgQueryParameters,
    entryValidator,
  );
  const metrics = await loadTableMetrics(tableName);

  return {
    entries,
    total: metrics.count,
  };
};
