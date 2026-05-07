import { v4 as uuidv4 } from 'uuid';
import { createOrUpdateBaseField } from '../../database';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
} from '../../types';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	InternallyWritableBaseField,
	BaseField,
} from '../../types';

const createTestBaseField = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<InternallyWritableBaseField>,
): Promise<BaseField> => {
	const id = uuidv4();
	const defaultValues: InternallyWritableBaseField = {
		shortCode: `test_field_${id}`,
		label: `Test Field ${id}`,
		description: `A test field for integration tests (${id})`,
		category: BaseFieldCategory.ORGANIZATION,
		dataType: BaseFieldDataType.STRING,
		sensitivityClassification: BaseFieldSensitivityClassification.RESTRICTED,
		valueRelevanceHours: null,
	};
	return await createOrUpdateBaseField(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestBaseField };
