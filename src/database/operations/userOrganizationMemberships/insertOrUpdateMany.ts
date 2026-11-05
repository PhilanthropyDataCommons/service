import type { TinyPg } from 'tinypg';
import type { KeycloakId } from '../../../types';

interface ListedMembership {
	userKeycloakUserId: KeycloakId;
	organizationKeycloakId: KeycloakId;
}

interface InsertOrUpdateManyResultRow {
	wasInserted: boolean;
}

const insertOrUpdateMany = async (
	db: TinyPg,
	listedMemberships: ListedMembership[],
	syncedFromKeycloakAt?: string | null,
): Promise<InsertOrUpdateManyResultRow[]> => {
	const { rows } = await db.sql<InsertOrUpdateManyResultRow>(
		'userOrganizationMemberships.insertOrUpdateMany',
		{
			memberships: JSON.stringify(listedMemberships),
			syncedFromKeycloakAt: syncedFromKeycloakAt ?? null,
		},
	);
	return rows;
};

export { insertOrUpdateMany };
export type { ListedMembership };
