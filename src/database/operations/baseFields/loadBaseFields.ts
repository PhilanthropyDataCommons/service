import { db } from '../../db';
import type { BaseField, JsonResultSet } from '../../../types';

export const loadBaseFields = async (): Promise<BaseField[]> =>
	(await db.sql<JsonResultSet<BaseField>>('baseFields.selectAll')).rows.map(
		(row) => row.object,
	);
