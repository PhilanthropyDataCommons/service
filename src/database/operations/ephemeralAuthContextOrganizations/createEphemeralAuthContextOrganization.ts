import { generateCreateItemOperation } from '../generators';
import type {
	EphemeralAuthContextOrganization,
	InternallyWritableEphemeralAuthContextOrganization,
} from '../../../types';

const createEphemeralAuthContextOrganization = generateCreateItemOperation<
	EphemeralAuthContextOrganization,
	InternallyWritableEphemeralAuthContextOrganization,
	[]
>(
	'ephemeralAuthContextOrganizations.insertOne',
	['authContextId', 'keycloakOrganizationId'],
	[],
);

export { createEphemeralAuthContextOrganization };
