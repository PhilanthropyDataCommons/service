import { db } from '../../db';
import { DEFAULT_SENSITIVITY_FILTER } from '../../../queryParameters/extractBaseFieldSensitivityClassificationsParameter';
import type {
	BaseFieldSensitivityClassification as Sensitivity,
	BaseField,
	JsonResultSet,
} from '../../../types';
import type { ExpandedParameterFilter } from '../../parameters';

export const loadBaseFields = async (
	sensitivityFilter: ExpandedParameterFilter<Sensitivity> = DEFAULT_SENSITIVITY_FILTER,
): Promise<BaseField[]> =>
	(
		await db.sql<JsonResultSet<BaseField>>('baseFields.select', {
			sensitivityFilter,
		})
	).rows.map((row) => row.object);
