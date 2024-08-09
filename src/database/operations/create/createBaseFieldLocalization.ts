import { db as defaultDb } from '../../db';
import type {
	BaseFieldLocalization,
	JsonResultSet,
	WritableBaseFieldLocalization,
} from '../../../types';

export const createBaseFieldLocalization = async (
	createValues: WritableBaseFieldLocalization,
	db = defaultDb,
): Promise<BaseFieldLocalization> => {
	const { baseFieldId, language, label, description } = createValues;
	const result = await db.sql<JsonResultSet<BaseFieldLocalization>>(
		'baseFieldLocalizations.insertOne',
		{
			baseFieldId,
			language,
			label,
			description,
		},
	);
	const baseFieldLocalization = result.rows[0]?.object;
	if (baseFieldLocalization === undefined) {
		throw new Error(
			'The base field localization creation did not appear to fail, but no data was returned by the operation.',
		);
	}

	return baseFieldLocalization;
};
