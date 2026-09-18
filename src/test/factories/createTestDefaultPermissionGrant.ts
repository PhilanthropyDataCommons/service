import { createDefaultPermissionGrant } from '../../database';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../../types';
import { getTestUserKeycloakUserId } from '../utils';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	DefaultPermissionGrant,
	WritableDefaultPermissionGrant,
} from '../../types';

const createTestDefaultPermissionGrant = async (
	db: TinyPg,
	authContext: AuthContext,
	overrideValues?: WritableDefaultPermissionGrant,
): Promise<DefaultPermissionGrant> => {
	const defaultValues: WritableDefaultPermissionGrant = {
		granteeType: PermissionGrantGranteeType.USER,
		granteeUserKeycloakUserId: getTestUserKeycloakUserId(),
		contextEntityType: PermissionGrantEntityType.CHANGEMAKER,
		scope: [PermissionGrantEntityType.CHANGEMAKER],
		verbs: [PermissionGrantVerb.VIEW],
	};
	return await createDefaultPermissionGrant(
		db,
		authContext,
		overrideValues ?? defaultValues,
	);
};

export { createTestDefaultPermissionGrant };
