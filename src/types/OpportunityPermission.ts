import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

enum OpportunityPermission {
	MANAGE = 'manage',
	EDIT = 'edit',
	VIEW = 'view',
	CREATE_PROPOSAL = 'create_proposal',
}

const opportunityPermissionSchema: JSONSchemaType<OpportunityPermission> = {
	type: 'string',
	enum: Object.values(OpportunityPermission),
};

const isOpportunityPermission = ajv.compile(opportunityPermissionSchema);

export {
	OpportunityPermission,
	opportunityPermissionSchema,
	isOpportunityPermission,
};
