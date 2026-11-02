import { generateDeleteManyOperation } from '../generators';
import { stringToKeycloakId } from '../../../types';
import type { KeycloakId } from '../../../types';

interface DeleteManyByLastSyncedBeforeResultRow {
	keycloak_organization_id: string;
}

const deleteManyOrganizationsByLastSyncedBefore = generateDeleteManyOperation<
	DeleteManyByLastSyncedBeforeResultRow,
	KeycloakId,
	[
		syncedBefore: string,
		disabledAt: string,
		syncedFromKeycloakAt?: string | null,
	]
>(
	'organizations.deleteManyByLastSyncedBefore',
	['syncedBefore', 'disabledAt', 'syncedFromKeycloakAt'],
	(row) => stringToKeycloakId(row.keycloak_organization_id),
);

export { deleteManyOrganizationsByLastSyncedBefore };
