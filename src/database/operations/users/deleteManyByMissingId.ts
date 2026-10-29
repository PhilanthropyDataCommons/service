import type { TinyPg } from 'tinypg';

interface DeleteManyByMissingIdResultRow {
	keycloak_user_id: string;
}

const deleteManyByMissingId = async (
	db: TinyPg,
	activeUsers: string[],
	skipDisabledAts: string[],
	syncedFromKeycloakAt?: string | null,
): Promise<DeleteManyByMissingIdResultRow[]> => {
	const { rows } = await db.sql<DeleteManyByMissingIdResultRow>(
		'users.deleteManyByMissingId',
		{
			activeUsers,
			skipDisabledAts,
			syncedFromKeycloakAt: syncedFromKeycloakAt ?? null,
		},
	);
	return rows;
};

export { deleteManyByMissingId };
