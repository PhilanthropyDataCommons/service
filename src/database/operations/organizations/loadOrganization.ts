import { generateLoadItemOperation } from '../generators';
import type { KeycloakId, Organization } from '../../../types';

const loadOrganization = generateLoadItemOperation<
	Organization,
	[keycloakOrganizationId: KeycloakId]
>('organizations.selectByKeycloakId', 'Organization', [
	'keycloakOrganizationId',
]);

export { loadOrganization };
