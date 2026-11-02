import { generateInsertOrUpdateManyOperation } from '../generators';
import { stringToKeycloakId } from '../../../types';
import type { KeycloakId } from '../../../types';

interface ListedOrganization {
	id: KeycloakId;
	name: string | null;
	enabled: boolean;
}

interface InsertOrUpdateManyOrganizationsResultRow {
	keycloak_organization_id: string;
	wasInserted: boolean;
}

interface InsertOrUpdateManyOrganizationsResult {
	keycloakOrganizationId: KeycloakId;
	wasInserted: boolean;
}

const insertOrUpdateManyOrganizations = generateInsertOrUpdateManyOperation<
	InsertOrUpdateManyOrganizationsResultRow,
	InsertOrUpdateManyOrganizationsResult,
	[syncedFromKeycloakAt: string, disabledAt: string]
>(
	'organizations.insertOrUpdateMany',
	'organizations',
	['syncedFromKeycloakAt', 'disabledAt'],
	(row) => ({
		keycloakOrganizationId: stringToKeycloakId(row.keycloak_organization_id),
		wasInserted: row.wasInserted,
	}),
);

export { insertOrUpdateManyOrganizations };
export type { InsertOrUpdateManyOrganizationsResult, ListedOrganization };
