import { generateCreateOrUpdateItemOperation } from '../generators';
import type {
	EphemeralUserGroupAssociation,
	InternallyWritableEphemeralUserGroupAssociation,
} from '../../../types';

const createEphemeralUserGroupAssociation = generateCreateOrUpdateItemOperation<
	EphemeralUserGroupAssociation,
	InternallyWritableEphemeralUserGroupAssociation,
	[]
>(
	'ephemeralUserGroupAssociations.insertOne',
	['userKeycloakUserId', 'userGroupKeycloakOrganizationId', 'notAfter'],
	[],
);

export { createEphemeralUserGroupAssociation };
