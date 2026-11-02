import type { TinyPg } from 'tinypg';
import type { KeycloakId } from '../../../types';

interface ListedOrganization {
	id: KeycloakId;
	name: string | null;
	enabled: boolean;
}

interface InsertOrUpdateManyResultRow {
	wasInserted: boolean;
}

const insertOrUpdateMany = async (
	db: TinyPg,
	listedOrganizations: ListedOrganization[],
	syncedFromKeycloakAt?: string | null,
	disabledAt?: string | null,
): Promise<InsertOrUpdateManyResultRow[]> => {
	const { rows } = await db.sql<InsertOrUpdateManyResultRow>(
		'organizations.insertOrUpdateMany',
		{
			organizations: JSON.stringify(listedOrganizations),
			syncedFromKeycloakAt: syncedFromKeycloakAt ?? null,
			disabledAt: disabledAt ?? null,
		},
	);
	return rows;
};

export { insertOrUpdateMany };
export type { ListedOrganization };
