import { db } from '../../db';
import { BaseFieldSensitivityClassification as Sensitivity } from '../../../types';
import type { ExpandedParameterFilter } from '../../parameters';
import type { BaseField, JsonResultSet } from '../../../types';

export const loadBaseFields = async (
	sensitivityFilter: ExpandedParameterFilter<Sensitivity> = {
		isNegated: false,
		list: Object.values(Sensitivity).filter((c) => c !== Sensitivity.FORBIDDEN),
	},
): Promise<BaseField[]> =>
	(
		await db.sql<JsonResultSet<BaseField>>('baseFields.select', {
			sensitivityFilter,
		})
	).rows.map((row) => row.object);
