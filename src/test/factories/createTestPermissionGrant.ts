import { createChangemaker, createPermissionGrant } from '../../database';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../../types';
import { getTestUserKeycloakUserId } from '../utils';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	Changemaker,
	PermissionGrant,
	WritablePermissionGrant,
} from '../../types';

let systemChangemaker: Changemaker | null = null;

const getOrCreateSystemChangemaker = async (
	db: TinyPg,
): Promise<Changemaker> => {
	systemChangemaker ??= await createChangemaker(db, null, {
		taxId: '99-9999999',
		name: 'System Test Changemaker',
		keycloakOrganizationId: null,
	});
	return systemChangemaker;
};

const resetTestPermissionGrantFactory = (): void => {
	systemChangemaker = null;
};

const createTestPermissionGrant = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: WritablePermissionGrant,
): Promise<PermissionGrant> => {
	if (overrideValues !== undefined) {
		return await createPermissionGrant(db, authContext, overrideValues);
	}
	const changemaker = await getOrCreateSystemChangemaker(db);
	const defaultValues: WritablePermissionGrant = {
		granteeType: PermissionGrantGranteeType.USER,
		granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
		contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
		changemakerId: changemaker.id,
		scope: [PermissionGrantEntityType.CHANGEMAKER],
		verbs: [PermissionGrantVerb.VIEW],
	};
	return await createPermissionGrant(db, authContext, defaultValues);
};

export { createTestPermissionGrant, resetTestPermissionGrantFactory };
