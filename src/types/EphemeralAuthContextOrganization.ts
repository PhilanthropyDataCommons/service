import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';

interface EphemeralAuthContextOrganization {
	readonly authContextId: string;
	readonly keycloakOrganizationId: KeycloakId;
	readonly createdAt: string;
}

type InternallyWritableEphemeralAuthContextOrganization =
	Writable<EphemeralAuthContextOrganization> &
		Pick<
			EphemeralAuthContextOrganization,
			'authContextId' | 'keycloakOrganizationId'
		>;

export {
	type EphemeralAuthContextOrganization,
	type InternallyWritableEphemeralAuthContextOrganization,
};
