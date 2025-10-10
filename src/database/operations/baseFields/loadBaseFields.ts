import { db } from '../../db';
import { BaseFieldSensitivityClassification } from '../../../types';
import type { ExpandedParameterFilter } from '../../parameters';
import type { BaseField, JsonResultSet } from '../../../types';

export const loadBaseFields = async (
	sensitivityFilter: ExpandedParameterFilter<BaseFieldSensitivityClassification> = {
		name: 'Do we even need this?',
		isNegated: false,
		list: Object.values(BaseFieldSensitivityClassification),
	},
): Promise<BaseField[]> =>
	(
		await db.sql<JsonResultSet<BaseField>>('baseFields.select', {
			sensitivityFilter,
		})
	).rows.map((row) => row.object);
