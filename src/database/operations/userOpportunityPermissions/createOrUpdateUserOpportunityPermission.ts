import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	UserOpportunityPermission,
	InternallyWritableUserOpportunityPermission,
} from '../../../types';

const createOrUpdateUserOpportunityPermission =
	generateCreateOrUpdateItemOperation<
		UserOpportunityPermission,
		InternallyWritableUserOpportunityPermission,
		[]
	>(
		'userOpportunityPermissions.insertOrUpdateOne',
		['userKeycloakUserId', 'opportunityPermission', 'opportunityId'],
		[],
	);

export { createOrUpdateUserOpportunityPermission };
