import { ajv } from '../ajv';
import type { OpportunityPermission } from './OpportunityPermission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { KeycloakId } from './KeycloakId';
import type { Id } from './Id';

interface UserOpportunityPermission {
	readonly userKeycloakUserId: KeycloakId;
	readonly opportunityId: Id;
	readonly opportunityPermission: OpportunityPermission;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserOpportunityPermission = Writable<UserOpportunityPermission>;

type InternallyWritableUserOpportunityPermission =
	WritableUserOpportunityPermission &
		Pick<
			UserOpportunityPermission,
			'userKeycloakUserId' | 'opportunityPermission' | 'opportunityId'
		>;

const writableUserOpportunityPermissionSchema: JSONSchemaType<WritableUserOpportunityPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableUserOpportunityPermission = ajv.compile(
	writableUserOpportunityPermissionSchema,
);

export {
	type InternallyWritableUserOpportunityPermission,
	type UserOpportunityPermission,
	type WritableUserOpportunityPermission,
	isWritableUserOpportunityPermission,
};
