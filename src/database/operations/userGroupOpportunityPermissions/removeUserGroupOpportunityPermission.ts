import { generateRemoveItemOperation } from '../generators';
import type {
	Id,
	KeycloakId,
	OpportunityPermission,
	UserGroupOpportunityPermission,
} from '../../../types';

const removeUserGroupOpportunityPermission = generateRemoveItemOperation<
	UserGroupOpportunityPermission,
	[
		keycloakOrganizationId: KeycloakId,
		opportunityId: Id,
		opportunityPermission: OpportunityPermission,
	]
>(
	'userGroupOpportunityPermissions.deleteOne',
	'UserGroupOpportunityPermission',
	['keycloakOrganizationId', 'opportunityId', 'opportunityPermission'],
);

export { removeUserGroupOpportunityPermission };
