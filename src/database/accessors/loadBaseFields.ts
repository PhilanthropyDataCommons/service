import { db } from '../db';
import type { BaseField } from '../../types';

export const loadBaseFields = async (): Promise<BaseField[]> => (
  (await db.sql<BaseField>('baseFields.selectAll')).rows
);
