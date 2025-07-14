import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	OpportunityPermission,
	Id,
	UserGroupOpportunityPermission,
} from '../../../types';

const loadUserGroupOpportunityPermission = generateLoadItemOperation<
	UserGroupOpportunityPermission,
	[
		keycloakOrganizationId: KeycloakId,
		opportunityId: Id,
		opportunityPermission: OpportunityPermission,
	]
>(
	'userGroupOpportunityPermissions.selectByPrimaryKey',
	'UserGroupOpportunityPermission',
	['keycloakOrganizationId', 'opportunityId', 'opportunityPermission'],
);

export { loadUserGroupOpportunityPermission };
