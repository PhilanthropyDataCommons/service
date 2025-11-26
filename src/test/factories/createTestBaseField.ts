import { createOrUpdateBaseField } from '../../database';
import {
	BaseFieldDataType,
	BaseFieldCategory,
	BaseFieldSensitivityClassification,
} from '../../types';
import type { TinyPg } from 'tinypg';
import type { AuthContext, BaseField, InternallyWritableBaseField } from '../../types';

const INCREMENT = 1;
let testFieldCounter = 0;

const createTestBaseField = async (
	db: TinyPg,
	authContext: AuthContext | null = null,
	overrideValues?: Partial<InternallyWritableBaseField>,
): Promise<BaseField> => {
	testFieldCounter += INCREMENT;
	const defaultValues: InternallyWritableBaseField = {
		shortCode: `test_field_${testFieldCounter}`,
		label: 'Test Field',
		description: 'A test field for testing',
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
