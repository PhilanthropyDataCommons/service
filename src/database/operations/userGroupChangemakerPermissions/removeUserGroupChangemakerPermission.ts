import { generateRemoveItemOperation } from '../generators';
import type {
	Id,
	KeycloakId,
	Permission,
	UserGroupChangemakerPermission,
} from '../../../types';

const removeUserGroupChangemakerPermission = generateRemoveItemOperation<
	UserGroupChangemakerPermission,
	[
		keycloakOrganizationId: KeycloakId,
		changemakerId: Id,
		permission: Permission,
	]
>(
	'userGroupChangemakerPermissions.deleteOne',
	'UserGroupChangemakerPermission',
	['keycloakOrganizationId', 'changemakerId', 'permission'],
);

export { removeUserGroupChangemakerPermission };
