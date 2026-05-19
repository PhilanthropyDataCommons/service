import { v4 as uuidv4 } from 'uuid';
import { createChangemaker, createSource } from '../../database';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	Changemaker,
	Id,
	Source,
	WritableSource,
} from '../../types';

type ObjectWithOrganizationKey =
	| { changemakerId: Id }
	| { funderShortCode: string }
	| { dataProviderShortCode: string };

let defaultChangemakerPromise: Promise<Changemaker> | null = null;

const getOrCreateDefaultChangemaker = async (
	db: TinyPg,
	authContext: AuthContext | null,
): Promise<Changemaker> => {
	defaultChangemakerPromise ??= createChangemaker(db, authContext, {
		taxId: `default_test_source_changemaker_${uuidv4()}`,
		name: 'Default Test Source Changemaker',
		keycloakOrganizationId: null,
	});
	return await defaultChangemakerPromise;
};

const resetTestSourceFactory = (): void => {
	defaultChangemakerPromise = null;
};

const isObjectWithOrganizationKey = (
	overrideValues: unknown,
): overrideValues is ObjectWithOrganizationKey =>
	overrideValues instanceof Object &&
	(('changemakerId' in overrideValues &&
		overrideValues.changemakerId !== undefined) ||
		('funderShortCode' in overrideValues &&
			overrideValues.funderShortCode !== undefined) ||
		('dataProviderShortCode' in overrideValues &&
			overrideValues.dataProviderShortCode !== undefined));

const createTestSource = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<WritableSource>,
): Promise<Source> => {
	const defaultChangemaker = await getOrCreateDefaultChangemaker(
		db,
		authContext,
	);
	const defaultValues = {
		label: `Test Source ${uuidv4()}`,
	};
	const resolvedObjectWithOrganizationKey: ObjectWithOrganizationKey =
		isObjectWithOrganizationKey(overrideValues)
			? overrideValues // This will have more than just the organization key, but that's OK
			: { changemakerId: defaultChangemaker.id };

	return await createSource(db, authContext, {
		...defaultValues,
		...resolvedObjectWithOrganizationKey,
		...overrideValues,
	});
};

export { createTestSource, resetTestSourceFactory };
