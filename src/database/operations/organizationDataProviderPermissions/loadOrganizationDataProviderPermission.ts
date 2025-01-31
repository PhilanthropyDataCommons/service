import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	OrganizationDataProviderPermission,
} from '../../../types';

const loadOrganizationDataProviderPermission = generateLoadItemOperation<
	OrganizationDataProviderPermission,
	[
		keycloakOrganizationId: KeycloakId,
		dataProviderShortCode: ShortCode,
		permission: Permission,
	]
>(
	'organizationDataProviderPermissions.selectByPrimaryKey',
	'OrganizationDataProviderPermission',
	['keycloakOrganizationId', 'dataProviderShortCode', 'permission'],
);

export { loadOrganizationDataProviderPermission };
