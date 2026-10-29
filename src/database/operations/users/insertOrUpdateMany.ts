import type { TinyPg } from 'tinypg';
import type { KeycloakId } from '../../../types';

interface ListedUser {
	id: KeycloakId;
	name: string | null;
	enabled: boolean;
}

interface InsertOrUpdateManyResultRow {
	wasInserted: boolean;
}

const insertOrUpdateMany = async (
	db: TinyPg,
	listedUsers: ListedUser[],
	syncedFromKeycloakAt?: string | null,
	disabledAt?: string | null,
): Promise<InsertOrUpdateManyResultRow[]> => {
	const { rows } = await db.sql<InsertOrUpdateManyResultRow>(
		'users.insertOrUpdateMany',
		{
			users: JSON.stringify(listedUsers),
			syncedFromKeycloakAt: syncedFromKeycloakAt ?? null,
			disabledAt: disabledAt ?? null,
		},
	);
	return rows;
};

export { insertOrUpdateMany };
export type { ListedUser };
