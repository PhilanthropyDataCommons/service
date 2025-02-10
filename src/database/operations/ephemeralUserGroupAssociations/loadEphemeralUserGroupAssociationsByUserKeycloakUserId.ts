import { generateLoadBundleOperation } from '../generators';
import { EphemeralUserGroupAssociation, type KeycloakId } from '../../../types';

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
