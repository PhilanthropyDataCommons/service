import { generateInsertOrUpdateManyOperation } from '../generators';
import { stringToKeycloakId } from '../../../types';
import type { KeycloakId } from '../../../types';

interface ListedMembership {
	userKeycloakUserId: KeycloakId;
	organizationKeycloakId: KeycloakId;
}

interface InsertOrUpdateManyOrganizationMembershipsResultRow {
	user_keycloak_user_id: string;
	wasInserted: boolean;
}

interface InsertOrUpdateManyOrganizationMembershipsResult {
	userKeycloakUserId: KeycloakId;
	wasInserted: boolean;
}

const insertOrUpdateManyOrganizationMemberships =
	generateInsertOrUpdateManyOperation<
		InsertOrUpdateManyOrganizationMembershipsResultRow,
		InsertOrUpdateManyOrganizationMembershipsResult,
		[syncedFromKeycloakAt: string]
	>(
		'userOrganizationMemberships.insertOrUpdateMany',
		'memberships',
		['syncedFromKeycloakAt'],
		(row) => ({
			userKeycloakUserId: stringToKeycloakId(row.user_keycloak_user_id),
			wasInserted: row.wasInserted,
		}),
	);

export { insertOrUpdateManyOrganizationMemberships };
export type {
	InsertOrUpdateManyOrganizationMembershipsResult,
	ListedMembership,
};
