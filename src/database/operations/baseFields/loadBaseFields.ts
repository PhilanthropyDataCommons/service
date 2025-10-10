import { db } from '../../db';
import { BaseFieldSensitivityClassification } from '../../../types';
import type { BaseField, JsonResultSet } from '../../../types';

export const loadBaseFields = async (
	isNegated = false,
	sensitivityClassification: BaseFieldSensitivityClassification[] = Object.values(
		BaseFieldSensitivityClassification,
	),
): Promise<BaseField[]> =>
	(
		await db.sql<JsonResultSet<BaseField>>('baseFields.select', {
			isNegated,
			sensitivityClassification,
		})
	).rows.map((row) => row.object);
