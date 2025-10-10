import { db } from '../../db';
import { BaseFieldSensitivityClassification } from '../../../types';
import type { BaseField, JsonResultSet } from '../../../types';

export const loadBaseFields = async (
	sensitivityClassification: string[] = Object.values(
		BaseFieldSensitivityClassification,
	),
): Promise<BaseField[]> =>
	(
		await db.sql<JsonResultSet<BaseField>>('baseFields.select', {
			sensitivityClassification,
		})
	).rows.map((row) => row.object);
