import { KeycloakId } from './KeycloakId';
import { Writable } from './Writable';

interface EphemeralUserGroupAssociation {
	readonly userKeycloakUserId: KeycloakId;
	readonly userGroupKeycloakOrganizationId: KeycloakId;
	readonly createdAt: string;
	readonly notAfter: string;
}

type WritableEphemeralUserGroupAssociation =
	Writable<EphemeralUserGroupAssociation>;

type InternallyWritableEphemeralUserGroupAssociation =
	WritableEphemeralUserGroupAssociation &
		Pick<
			EphemeralUserGroupAssociation,
			'userKeycloakUserId' | 'userGroupKeycloakOrganizationId' | 'notAfter'
		>;

export {
	type EphemeralUserGroupAssociation,
	type InternallyWritableEphemeralUserGroupAssociation,
	type WritableEphemeralUserGroupAssociation,
};
