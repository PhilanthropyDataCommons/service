import { loadBundle } from '../generic/loadBundle';
import type {
	JsonResultSet,
	Bundle,
	SyncBaseField,
	AuthContext,
	KeycloakUserId,
} from '../../../types';

export const loadSyncBaseFieldBundle = async (
	authContext: AuthContext | undefined,
	createdBy: KeycloakUserId | undefined,
	limit: number | undefined,
	offset: number,
): Promise<Bundle<SyncBaseField>> => {
	const authContextKeycloakUserId = authContext?.user.keycloakUserId;
	const authContextIsAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<SyncBaseField>>(
		'syncBaseFields.selectWithPagination',
		{
			authContextIsAdministrator,
			authContextKeycloakUserId,
			createdBy,
			limit,
			offset,
		},
		'sync_basefields',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
