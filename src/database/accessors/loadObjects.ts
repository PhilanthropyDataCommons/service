import { db } from '../db';
import type { TinyPgParams } from 'tinypg';

export const loadObjects = async <T extends object>(
  tinyPgQueryName: string,
  tinyPgQueryParameters: TinyPgParams,
): Promise<T[]> => {
  const { rows } = await db.sql<T>(
    tinyPgQueryName,
    tinyPgQueryParameters,
  );

  return rows;
};
