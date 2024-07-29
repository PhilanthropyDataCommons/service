import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import type {
	BaseFieldLocalization,
	WritableBaseFieldLocalization,
	JsonResultSet,
} from '../../../types';

export const updateBaseFieldLocalization = async (
	updateValues: WritableBaseFieldLocalization,
): Promise<BaseFieldLocalization> => {
	const { baseFieldId, language, label, description } = updateValues;
	const result = await db.sql<JsonResultSet<BaseFieldLocalization>>(
		'baseFieldLocalizations.updateByPrimaryKey',
		{
			baseFieldId,
			language,
			label,
			description,
		},
	);
	const baseFieldLocalization = result.rows[0]?.object;
	if (baseFieldLocalization === undefined) {
		throw new NotFoundError('This base field localization does not exist.');
	}
	return baseFieldLocalization;
};
