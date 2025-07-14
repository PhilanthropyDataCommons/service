import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	UserGroupOpportunityPermission,
	InternallyWritableUserGroupOpportunityPermission,
} from '../../../types';

const createOrUpdateUserGroupOpportunityPermission =
	generateCreateOrUpdateItemOperation<
		UserGroupOpportunityPermission,
		InternallyWritableUserGroupOpportunityPermission,
		[]
	>(
		'userGroupOpportunityPermissions.insertOrUpdateOne',
		['keycloakOrganizationId', 'opportunityPermission', 'opportunityId'],
		[],
	);

export { createOrUpdateUserGroupOpportunityPermission };
