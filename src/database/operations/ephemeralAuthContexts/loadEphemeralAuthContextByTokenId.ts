import { generateLoadItemOperation } from '../generators';
import type { EphemeralAuthContext, KeycloakId } from '../../../types';

const loadEphemeralAuthContextByTokenId = generateLoadItemOperation<
	EphemeralAuthContext,
	[userKeycloakUserId: KeycloakId, tokenId: string]
>('ephemeralAuthContexts.selectByTokenId', 'EphemeralAuthContext', [
	'userKeycloakUserId',
	'tokenId',
]);

export { loadEphemeralAuthContextByTokenId };
