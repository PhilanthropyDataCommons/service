import { generateDeleteManyOperation } from '../generators';
import { stringToKeycloakId } from '../../../types';
import type { KeycloakId } from '../../../types';

interface DeleteManyByLastSyncedBeforeResultRow {
	user_keycloak_user_id: string;
}

const deleteManyOrganizationMembershipsByLastSyncedBefore =
	generateDeleteManyOperation<
		DeleteManyByLastSyncedBeforeResultRow,
		KeycloakId,
		[
			syncedBefore: string,
			disabledAt: string,
			syncedFromKeycloakAt?: string | null,
			organizationKeycloakId?: string | null,
		]
	>(
		'userOrganizationMemberships.deleteManyByLastSyncedBefore',
		[
			'syncedBefore',
			'disabledAt',
			'syncedFromKeycloakAt',
			'organizationKeycloakId',
		],
		(row) => stringToKeycloakId(row.user_keycloak_user_id),
	);

export { deleteManyOrganizationMembershipsByLastSyncedBefore };
