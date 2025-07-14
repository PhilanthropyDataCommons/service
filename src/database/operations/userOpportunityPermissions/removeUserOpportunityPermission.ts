import { generateRemoveItemOperation } from '../generators';
import type {
	KeycloakId,
	OpportunityPermission,
	Id,
	UserOpportunityPermission,
} from '../../../types';

const removeUserOpportunityPermission = generateRemoveItemOperation<
	UserOpportunityPermission,
	[
		userKeycloakUserId: KeycloakId,
		opportunityId: Id,
		opportunityPermission: OpportunityPermission,
	]
>('userOpportunityPermissions.deleteOne', 'UserOpportunityPermission', [
	'userKeycloakUserId',
	'opportunityId',
	'opportunityPermission',
]);

export { removeUserOpportunityPermission };
