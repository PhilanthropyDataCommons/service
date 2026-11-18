import type { KeycloakId } from './KeycloakId';
import type { Writable } from './Writable';

interface EphemeralAuthContext {
	readonly tokenId: string;
	readonly userKeycloakUserId: KeycloakId;
	readonly notAfter: string;
	readonly createdAt: string;
}

type InternallyWritableEphemeralAuthContext = Writable<EphemeralAuthContext> &
	Pick<EphemeralAuthContext, 'tokenId' | 'userKeycloakUserId' | 'notAfter'>;

export {
	type EphemeralAuthContext,
	type InternallyWritableEphemeralAuthContext,
};
