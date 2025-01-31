import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	Permission,
	ShortCode,
	OrganizationFunderPermission,
} from '../../../types';

const loadOrganizationFunderPermission = generateLoadItemOperation<
	OrganizationFunderPermission,
	[
		keycloakOrganizationId: KeycloakId,
		funderShortCode: ShortCode,
		permission: Permission,
	]
>(
	'organizationFunderPermissions.selectByPrimaryKey',
	'OrganizationFunderPermission',
	['keycloakOrganizationId', 'funderShortCode', 'permission'],
);

export { loadOrganizationFunderPermission };
