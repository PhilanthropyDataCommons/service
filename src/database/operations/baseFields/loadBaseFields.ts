import { db } from '../../db';
import type { BaseField, JsonResultSet } from '../../../types';

export const loadBaseFields = async (sensitivityClassification: string): Promise<BaseField[]> =>
	(await db.sql<JsonResultSet<BaseField>>('baseFields.select', { sensitivityClassification })).rows.map(
		(row) => row.object,
	);
