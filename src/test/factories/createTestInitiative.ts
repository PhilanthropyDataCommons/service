import { v4 as uuidv4 } from 'uuid';
import { createInitiative } from '../../database';
import { createTestChangemaker } from './createTestChangemaker';
import type { TinyPg } from 'tinypg';
import type { AuthContext, Initiative, WritableInitiative } from '../../types';

const createTestInitiative = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<WritableInitiative>,
): Promise<Initiative> => {
	const changemakerId =
		overrideValues?.changemakerId ??
		(await createTestChangemaker(db, authContext)).id;
	const defaultValues: WritableInitiative = {
		changemakerId,
		title: `Test Initiative ${uuidv4()}`,
	};
	return await createInitiative(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestInitiative };
