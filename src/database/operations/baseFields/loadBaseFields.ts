import { db } from '../../db';
import { DEFAULT_SENSITIVITY_FILTER } from '../../../queryParameters/extractBaseFieldSensitivityClassificationParameters';
import { getLogger } from '../../../logger';
import type {
	BaseFieldSensitivityClassification as Sensitivity,
	BaseField,
	JsonResultSet,
} from '../../../types';
import type { ExpandedParameterFilter } from '../../parameters';

const logger = getLogger(__filename);

export const loadBaseFields = async (
	sensitivityFilter: ExpandedParameterFilter<Sensitivity> = DEFAULT_SENSITIVITY_FILTER,
): Promise<BaseField[]> => {
	logger.info(
		`Got the following sensitivityFilter: ${JSON.stringify(sensitivityFilter)}`,
	);
	return (
		await db.sql<JsonResultSet<BaseField>>('baseFields.select', {
			sensitivityFilter,
		})
	).rows.map((row) => row.object);
};
