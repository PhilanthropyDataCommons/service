import type { TinyPg } from 'tinypg';

interface DisableManyLastSyncedBeforeResultRow {
	keycloak_organization_id: string;
}

const disableManyLastSyncedBefore = async (
	db: TinyPg,
	syncStartedAt: string,
	syncedFromKeycloakAt?: string | null,
): Promise<DisableManyLastSyncedBeforeResultRow[]> => {
	const { rows } = await db.sql<DisableManyLastSyncedBeforeResultRow>(
		'userOrganizationMemberships.disableManyLastSyncedBefore',
		{
			syncStartedAt,
			syncedFromKeycloakAt: syncedFromKeycloakAt ?? null,
		},
	);
	return rows;
};

export { disableManyLastSyncedBefore };
export type { DisableManyLastSyncedBeforeResultRow };
