import { v4 as uuidv4 } from 'uuid';
import {
	createEphemeralAuthContextOrganization,
	createOrUpdateEphemeralAuthContext,
} from '../../database';
import { allNoLeaks } from '../../promises';
import { getTestUserKeycloakUserId } from '../utils';
import type { TinyPg } from 'tinypg';
import type {
	AuthContext,
	EphemeralAuthContext,
	InternallyWritableEphemeralAuthContext,
	KeycloakId,
} from '../../types';

const createTestEphemeralAuthContext = async (
	db: TinyPg,
	authContext: AuthContext | null,
	overrideValues?: Partial<InternallyWritableEphemeralAuthContext>,
	keycloakOrganizationIds: KeycloakId[] = [],
): Promise<EphemeralAuthContext> => {
	const defaultValues: InternallyWritableEphemeralAuthContext = {
		tokenId: `testToken:${uuidv4()}`,
		userKeycloakUserId: getTestUserKeycloakUserId(),
		notAfter: 'infinity',
	};
	const { item } = await createOrUpdateEphemeralAuthContext(db, authContext, {
		...defaultValues,
		...overrideValues,
	});
	await allNoLeaks(
		keycloakOrganizationIds.map(
			async (keycloakOrganizationId) =>
				await createEphemeralAuthContextOrganization(db, authContext, {
					authContextId: item.tokenId,
					keycloakOrganizationId,
				}),
		),
	);
	return item;
};

export { createTestEphemeralAuthContext };
