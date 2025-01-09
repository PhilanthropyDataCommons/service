import { generateLoadItemOperation } from '../generators';
import type {
	Id,
	KeycloakId,
	Permission,
	UserChangemakerPermission,
} from '../../../types';

const loadUserChangemakerPermission = generateLoadItemOperation<
	UserChangemakerPermission,
	[userKeycloakUserId: KeycloakId, changemakerId: Id, permission: Permission]
>(
	'userChangemakerPermissions.selectByPrimaryKey',
	'UserChangemakerPermission',
	['userKeycloakUserId', 'changemakerId', 'permission'],
);

export { loadUserChangemakerPermission };
