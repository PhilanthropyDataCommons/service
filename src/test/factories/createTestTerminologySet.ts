import { v4 as uuidv4 } from 'uuid';
import { createOrUpdateFunder, createTerminologySet } from '../../database';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	Funder,
	TerminologySet,
	WritableTerminologySet,
} from '../../types';

let defaultFunderPromise: Promise<Funder> | null = null;

const getOrCreateDefaultFunder = async (
	db: TinyPg,
	authContext: AuthContext | null,
): Promise<Funder> => {
	defaultFunderPromise ??= createOrUpdateFunder(db, authContext, {
		shortCode: `default_test_terminology_set_funder_${uuidv4()}`,
		name: 'Default Test Terminology Set Funder',
		keycloakOrganizationId: null,
		isCollaborative: false,
		defaultTerminologySetId: null,
	}).then(({ item }) => item);
	return await defaultFunderPromise;
};

const resetTestTerminologySetFactory = (): void => {
	defaultFunderPromise = null;
};

const createTestTerminologySet = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<WritableTerminologySet>,
): Promise<TerminologySet> => {
	const funderShortCode =
		overrideValues?.funderShortCode ??
		(await getOrCreateDefaultFunder(db, authContext)).shortCode;
	const defaultValues: WritableTerminologySet = {
		funderShortCode,
		name: `Test Terminology Set ${uuidv4()}`,
		opportunityLabel: null,
		opportunitiesLabel: null,
		applicationFormLabel: null,
		applicationFormsLabel: null,
		proposalLabel: null,
		proposalsLabel: null,
	};
	return await createTerminologySet(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
};

export { createTestTerminologySet, resetTestTerminologySetFactory };
