import { ajv } from '../ajv';
import type { OpportunityPermission } from './OpportunityPermission';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { Id } from './Id';
import type { KeycloakId } from './KeycloakId';

interface UserGroupOpportunityPermission {
	readonly keycloakOrganizationId: KeycloakId;
	readonly opportunityId: Id;
	readonly opportunityPermission: OpportunityPermission;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type WritableUserGroupOpportunityPermission =
	Writable<UserGroupOpportunityPermission>;

type InternallyWritableUserGroupOpportunityPermission =
	WritableUserGroupOpportunityPermission &
		Pick<
			UserGroupOpportunityPermission,
			'keycloakOrganizationId' | 'opportunityPermission' | 'opportunityId'
		>;

const writableUserGroupOpportunityPermissionSchema: JSONSchemaType<WritableUserGroupOpportunityPermission> =
	{
		type: 'object',
		properties: {},
		required: [],
	};

const isWritableUserGroupOpportunityPermission = ajv.compile(
	writableUserGroupOpportunityPermissionSchema,
);

export {
	type InternallyWritableUserGroupOpportunityPermission,
	type UserGroupOpportunityPermission,
	type WritableUserGroupOpportunityPermission,
	isWritableUserGroupOpportunityPermission,
};
