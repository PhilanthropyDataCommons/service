import { v4 as uuidv4 } from 'uuid';
import { createInitiativeFieldValue } from '../../database';
import { BaseFieldCategory } from '../../types';
import { createTestBaseField } from './createTestBaseField';
import { createTestInitiative } from './createTestInitiative';
import { createTestSource } from './createTestSource';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	InitiativeFieldValue,
	InternallyWritableInitiativeFieldValue,
} from '../../types';

const createTestInitiativeFieldValue = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<InternallyWritableInitiativeFieldValue>,
): Promise<InitiativeFieldValue> => {
	const initiativeId =
		overrideValues?.initiativeId ??
		(await createTestInitiative(db, authContext)).id;
	const baseFieldShortCode =
		overrideValues?.baseFieldShortCode ??
		(
			await createTestBaseField(db, authContext, {
				category: BaseFieldCategory.PROJECT,
			})
		).shortCode;
	const sourceId =
		overrideValues?.sourceId ?? (await createTestSource(db, authContext)).id;
	const defaultValues: InternallyWritableInitiativeFieldValue = {
		initiativeId,
		baseFieldShortCode,
		sourceId,
		value: `Test Initiative Field Value ${uuidv4()}`,
		isValid: true,
		goodAsOf: null,
	};
	return await createInitiativeFieldValue(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestInitiativeFieldValue };
