import { generateUpsertItemOperation } from '../generators';
import type {
	EphemeralAuthContext,
	InternallyWritableEphemeralAuthContext,
} from '../../../types';

const createOrUpdateEphemeralAuthContext = generateUpsertItemOperation<
	EphemeralAuthContext,
	InternallyWritableEphemeralAuthContext,
	[]
>(
	'ephemeralAuthContexts.insertOrUpdateOne',
	['tokenId', 'userKeycloakUserId', 'notAfter'],
	[],
);

export { createOrUpdateEphemeralAuthContext };
