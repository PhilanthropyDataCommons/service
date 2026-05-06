import { generateUpsertItemOperation } from '../generators';
import type {
	EphemeralUserGroupAssociation,
	InternallyWritableEphemeralUserGroupAssociation,
} from '../../../types';

const createEphemeralUserGroupAssociation = generateUpsertItemOperation<
	EphemeralUserGroupAssociation,
	InternallyWritableEphemeralUserGroupAssociation,
	[]
>(
	'ephemeralUserGroupAssociations.insertOne',
	['userKeycloakUserId', 'userGroupKeycloakOrganizationId', 'notAfter'],
	[],
);

export { createEphemeralUserGroupAssociation };
