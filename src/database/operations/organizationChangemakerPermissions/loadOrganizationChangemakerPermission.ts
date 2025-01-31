import { generateLoadItemOperation } from '../generators';
import type {
	Id,
	KeycloakId,
	Permission,
	OrganizationChangemakerPermission,
} from '../../../types';

const loadOrganizationChangemakerPermission = generateLoadItemOperation<
	OrganizationChangemakerPermission,
	[
		keycloakOrganizationId: KeycloakId,
		changemakerId: Id,
		permission: Permission,
	]
>(
	'organizationChangemakerPermissions.selectByPrimaryKey',
	'OrganizationChangemakerPermission',
	['keycloakOrganizationId', 'changemakerId', 'permission'],
);

export { loadOrganizationChangemakerPermission };
