import { generateLoadItemOperation } from '../generators';
import type {
	Id,
	KeycloakId,
	Permission,
	UserGroupChangemakerPermission,
} from '../../../types';

const loadUserGroupChangemakerPermission = generateLoadItemOperation<
	UserGroupChangemakerPermission,
	[
		keycloakOrganizationId: KeycloakId,
		changemakerId: Id,
		permission: Permission,
	]
>(
	'userGroupChangemakerPermissions.selectByPrimaryKey',
	'UserGroupChangemakerPermission',
	['keycloakOrganizationId', 'changemakerId', 'permission'],
);

export { loadUserGroupChangemakerPermission };
