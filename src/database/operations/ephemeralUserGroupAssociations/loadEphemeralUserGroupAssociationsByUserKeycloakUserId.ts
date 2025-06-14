import { generateLoadBundleOperation } from '../generators';
import type { EphemeralUserGroupAssociation, KeycloakId } from '../../../types';

const loadEphemeralUserGroupAssociationsByUserKeycloakUserId =
	generateLoadBundleOperation<
		EphemeralUserGroupAssociation,
		[userKeycloakUserId: KeycloakId]
	>(
		'ephemeralUserGroupAssociations.selectByUserKeycloakUserId',
		'ephemeral_user_group_associations',
		['userKeycloakUserId'],
	);

export { loadEphemeralUserGroupAssociationsByUserKeycloakUserId };
