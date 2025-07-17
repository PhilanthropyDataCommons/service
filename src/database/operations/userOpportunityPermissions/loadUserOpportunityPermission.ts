import { generateLoadItemOperation } from '../generators';
import type {
	KeycloakId,
	OpportunityPermission,
	Id,
	UserOpportunityPermission,
} from '../../../types';

const loadUserOpportunityPermission = generateLoadItemOperation<
	UserOpportunityPermission,
	[
		userKeycloakUserId: KeycloakId,
		opportunityId: Id,
		opportunityPermission: OpportunityPermission,
	]
>(
	'userOpportunityPermissions.selectByPrimaryKey',
	'UserOpportunityPermission',
	['userKeycloakUserId', 'opportunityId', 'opportunityPermission'],
);

export { loadUserOpportunityPermission };
