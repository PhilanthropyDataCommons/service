import type { TinyPg } from 'tinypg';
import type { KeycloakId } from '../../../types';

interface DisableManyLastSyncedBeforeByOrganizationIdResultRow {
	keycloak_user_id: string;
}

const disableManyLastSyncedBeforeByOrganizationId = async (
	db: TinyPg,
	organizationKeycloakId: KeycloakId,
	syncStartedAt: string,
	syncedFromKeycloakAt?: string | null,
): Promise<DisableManyLastSyncedBeforeByOrganizationIdResultRow[]> => {
	const { rows } =
		await db.sql<DisableManyLastSyncedBeforeByOrganizationIdResultRow>(
			'userOrganizationMemberships.disableManyLastSyncedBeforeByOrganizationId',
			{
				organizationKeycloakId,
				syncStartedAt,
				syncedFromKeycloakAt: syncedFromKeycloakAt ?? null,
			},
		);
	return rows;
};

export { disableManyLastSyncedBeforeByOrganizationId };
export type { DisableManyLastSyncedBeforeByOrganizationIdResultRow };
