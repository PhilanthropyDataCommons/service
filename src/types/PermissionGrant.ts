/**
 * Permission Grant Configuration
 *
 * This file defines the permission grant type system. When adding or modifying
 * permissions, there are several data structures that must be kept in sync:
 *
 * 1. `PermissionGrantEntityType` enum — Add new entity types here. The string
 *    value must match the database `permission_grant_entity_type` enum.
 *
 * 2. `contextEntityKeyProperties` — Maps each entity type to its primary key
 *    field name and key type (integer ID or string short code). This determines
 *    which field appears on the permission grant when the entity is used as a
 *    context entity (e.g. `changemakerId` for CHANGEMAKER).
 *
 * 3. `allowedScopesForContextEntityType` — Defines which scopes can be granted
 *    when each entity type is used as the context. Scope inheritance flows
 *    through these lists: e.g. a grant on a CHANGEMAKER context can include
 *    CHANGEMAKER_FIELD_VALUE scope, meaning "this grant on a changemaker also
 *    covers its field values." To allow a new child entity's permissions to be
 *    granted from a parent context, add the child's entity type to the parent's
 *    scope list.
 *
 * 4. `SupportedConditions` — Defines optional conditions that can restrict a
 *    grant's scope to a subset of matching entities. Add a new entry keyed by
 *    the scope's entity type with the condition shape (field, operator, value).
 *
 * 5. `conditionSchemaForScope` — The JSON Schema used to validate conditions
 *    in API requests. Must have a matching entry for each key in
 *    `SupportedConditions`.
 *
 * Additionally, new entity types require a corresponding database migration to
 * add the value to the `permission_grant_entity_type` PostgreSQL enum, and any
 * SQL permission-check functions (e.g. `has_*_permission`) must be updated to
 * handle the new scope.
 */
import { ajv } from '../ajv';
import { BaseFieldCategory } from './BaseField';
import { keycloakIdSchema } from './KeycloakId';
import { PermissionGrantGranteeType } from './PermissionGrantGranteeType';
import { permissionGrantVerbSchema } from './PermissionGrantVerb';
import type { KeycloakId } from './KeycloakId';
import type { PermissionGrantVerb } from './PermissionGrantVerb';
import type { Writable } from './Writable';
import type { JSONSchemaType } from 'ajv';

// The types of entity supported by the permission system
enum PermissionGrantEntityType {
	FUNDER = 'funder',
	CHANGEMAKER = 'changemaker',
	DATA_PROVIDER = 'dataProvider',
	OPPORTUNITY = 'opportunity',
	PROPOSAL = 'proposal',
	PROPOSAL_VERSION = 'proposalVersion',
	APPLICATION_FORM = 'applicationForm',
	APPLICATION_FORM_FIELD = 'applicationFormField',
	PROPOSAL_FIELD_VALUE = 'proposalFieldValue',
	SOURCE = 'source',
	BULK_UPLOAD = 'bulkUpload',
	CHANGEMAKER_FIELD_VALUE = 'changemakerFieldValue',
}

enum PermissionGrantEntityKeyType {
	ID = 'id',
	SHORT_CODE = 'shortCode',
}

interface PermissionGrantEntityKeyValueType {
	[PermissionGrantEntityKeyType.ID]: number;
	[PermissionGrantEntityKeyType.SHORT_CODE]: string;
}

interface PermissionGrantEntityKeyProperty {
	keyName: string;
	keyType: PermissionGrantEntityKeyType;
}

// The key name for each grantee type
const granteeKeyProperties = {
	[PermissionGrantGranteeType.USER]: {
		keyName: 'granteeUserKeycloakUserId',
	},
	[PermissionGrantGranteeType.USER_GROUP]: {
		keyName: 'granteeKeycloakOrganizationId',
	},
} as const satisfies Record<PermissionGrantGranteeType, { keyName: string }>;

// The primary key name + data type for each context entity
const contextEntityKeyProperties = {
	[PermissionGrantEntityType.CHANGEMAKER]: {
		keyName: 'changemakerId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.FUNDER]: {
		keyName: 'funderShortCode',
		keyType: PermissionGrantEntityKeyType.SHORT_CODE,
	},
	[PermissionGrantEntityType.DATA_PROVIDER]: {
		keyName: 'dataProviderShortCode',
		keyType: PermissionGrantEntityKeyType.SHORT_CODE,
	},
	[PermissionGrantEntityType.OPPORTUNITY]: {
		keyName: 'opportunityId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.PROPOSAL]: {
		keyName: 'proposalId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.PROPOSAL_VERSION]: {
		keyName: 'proposalVersionId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.APPLICATION_FORM]: {
		keyName: 'applicationFormId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.APPLICATION_FORM_FIELD]: {
		keyName: 'applicationFormFieldId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: {
		keyName: 'proposalFieldValueId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.SOURCE]: {
		keyName: 'sourceId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.BULK_UPLOAD]: {
		keyName: 'bulkUploadTaskId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
	[PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE]: {
		keyName: 'changemakerFieldValueId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
} as const satisfies Record<
	PermissionGrantEntityType,
	PermissionGrantEntityKeyProperty
>;

// The scopes allowed for each context entity
const contextEntityTypeScopes = {
	[PermissionGrantEntityType.CHANGEMAKER]: [
		PermissionGrantEntityType.CHANGEMAKER,
		PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
		PermissionGrantEntityType.PROPOSAL,
		PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
	],
	[PermissionGrantEntityType.FUNDER]: [
		PermissionGrantEntityType.FUNDER,
		PermissionGrantEntityType.OPPORTUNITY,
		PermissionGrantEntityType.PROPOSAL,
		PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
	],
	[PermissionGrantEntityType.DATA_PROVIDER]: [
		PermissionGrantEntityType.DATA_PROVIDER,
	],
	[PermissionGrantEntityType.OPPORTUNITY]: [
		PermissionGrantEntityType.OPPORTUNITY,
		PermissionGrantEntityType.PROPOSAL,
		PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
	],
	[PermissionGrantEntityType.PROPOSAL]: [
		PermissionGrantEntityType.PROPOSAL,
		PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
	],
	[PermissionGrantEntityType.PROPOSAL_VERSION]: [
		PermissionGrantEntityType.PROPOSAL_VERSION,
	],
	[PermissionGrantEntityType.APPLICATION_FORM]: [
		PermissionGrantEntityType.APPLICATION_FORM,
	],
	[PermissionGrantEntityType.APPLICATION_FORM_FIELD]: [
		PermissionGrantEntityType.APPLICATION_FORM_FIELD,
	],
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: [
		PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
	],
	[PermissionGrantEntityType.SOURCE]: [PermissionGrantEntityType.SOURCE],
	[PermissionGrantEntityType.BULK_UPLOAD]: [
		PermissionGrantEntityType.BULK_UPLOAD,
	],
	[PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE]: [
		PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
	],
} as const satisfies Record<
	PermissionGrantEntityType,
	readonly PermissionGrantEntityType[]
>;

// The conditions allowed for each scope
interface PermissionGrantCondition {
	field: string;
	operator: string;
	value: string[];
}

const scopeConditions = {
	[PermissionGrantEntityType.CHANGEMAKER]: [],
	[PermissionGrantEntityType.FUNDER]: [],
	[PermissionGrantEntityType.DATA_PROVIDER]: [],
	[PermissionGrantEntityType.OPPORTUNITY]: [],
	[PermissionGrantEntityType.PROPOSAL]: [],
	[PermissionGrantEntityType.PROPOSAL_VERSION]: [],
	[PermissionGrantEntityType.APPLICATION_FORM]: [],
	[PermissionGrantEntityType.APPLICATION_FORM_FIELD]: [],
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: [
		{
			field: 'baseFieldCategory',
			operator: 'in',
			value: Object.values(BaseFieldCategory),
		},
	],
	[PermissionGrantEntityType.SOURCE]: [],
	[PermissionGrantEntityType.BULK_UPLOAD]: [],
	[PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE]: [],
} as const satisfies Record<
	PermissionGrantEntityType,
	readonly PermissionGrantCondition[]
>;

/////////////

type ScopesByContextEntityType = {
	[T in PermissionGrantEntityType]: (typeof contextEntityTypeScopes)[T][number];
};

type ContextEntityKeysByContextEntityType = {
	[T in PermissionGrantEntityType]: Record<
		(typeof contextEntityKeyProperties)[T]['keyName'],
		PermissionGrantEntityKeyValueType[(typeof contextEntityKeyProperties)[T]['keyType']]
	>;
};

interface PermissionGrantBase {
	readonly id: number;
	verbs: PermissionGrantVerb[];
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

type GranteeKeysByGranteeType = {
	[G in PermissionGrantGranteeType]: Record<
		(typeof granteeKeyProperties)[G]['keyName'],
		KeycloakId
	>;
};

type PermissionGrantVariant<
	T extends PermissionGrantEntityType,
	G extends PermissionGrantGranteeType,
> = PermissionGrantBase &
	GranteeKeysByGranteeType[G] &
	ContextEntityKeysByContextEntityType[T] & {
		granteeType: G;
		contextEntityType: T;
		scope: Array<ScopesByContextEntityType[T]>;
		conditions?: Partial<
			Record<PermissionGrantEntityType, PermissionGrantCondition>
		> | null;
	};

type PermissionGrant = {
	[T in PermissionGrantEntityType]: {
		[G in PermissionGrantGranteeType]: PermissionGrantVariant<T, G>;
	}[PermissionGrantGranteeType];
}[PermissionGrantEntityType];

type WritablePermissionGrant = Writable<PermissionGrant>;

const jsonSchemaTypeForPermissionGrantEntityKeyType: Record<
	PermissionGrantEntityKeyType,
	string
> = {
	[PermissionGrantEntityKeyType.ID]: 'integer',
	[PermissionGrantEntityKeyType.SHORT_CODE]: 'string',
};

const getSchemaForCondition = (
	condition: PermissionGrantCondition,
): JSONSchemaType<PermissionGrantCondition> => ({
	type: 'object',
	properties: {
		field: {
			type: 'string',
			enum: [condition.field],
		},
		operator: {
			type: 'string',
			enum: [condition.operator],
		},
		value: {
			type: 'array',
			items: {
				type: 'string',
				enum: [...condition.value],
			},
		},
	},
	required: ['field', 'operator', 'value'],
	additionalProperties: false,
});

const getSchemaForWritablePermissionGrantVariant = <
	T extends PermissionGrantEntityType,
	G extends PermissionGrantGranteeType,
>(
	granteeType: G,
	contextEntityType: T,
): JSONSchemaType<Writable<PermissionGrantVariant<T, G>>> => {
	const {
		[contextEntityType]: { keyName: contextKeyName, keyType: contextKeyType },
	} = contextEntityKeyProperties;
	const {
		[granteeType]: { keyName: granteeKeyName },
	} = granteeKeyProperties;

	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
	 * ajv's JSONSchemaType uses conditional types that cannot be resolved
	 * while T is a generic type parameter. The schema is structurally correct
	 * for the given T, but TypeScript cannot verify this statically.
	 */
	return {
		type: 'object',
		properties: {
			granteeType: {
				type: 'string',
				const: granteeType,
			},
			[granteeKeyName]: keycloakIdSchema,
			verbs: {
				type: 'array',
				items: permissionGrantVerbSchema,
				minItems: 1,
			},
			contextEntityType: {
				type: 'string',
				const: contextEntityType,
			},
			[contextKeyName]: {
				type: jsonSchemaTypeForPermissionGrantEntityKeyType[contextKeyType],
			},
			scope: {
				type: 'array',
				items: {
					type: 'string',
					enum: contextEntityTypeScopes[contextEntityType],
				},
				minItems: 1,
			},
			conditions: {
				type: 'object',
				nullable: true,
				properties: Object.fromEntries(
					contextEntityTypeScopes[contextEntityType].flatMap((scope) =>
						scopeConditions[scope].map((condition) => [
							scope,
							getSchemaForCondition(condition),
						]),
					),
				),
				additionalProperties: false,
			},
		},
		required: [
			'scope',
			'verbs',
			'granteeType',
			granteeKeyName,
			'contextEntityType',
			contextKeyName,
		],
		additionalProperties: false,
	} as unknown as JSONSchemaType<Writable<PermissionGrantVariant<T, G>>>;
};

const allSchemaVariants = Object.values(PermissionGrantEntityType).flatMap(
	(contextEntityType) => [
		getSchemaForWritablePermissionGrantVariant(
			PermissionGrantGranteeType.USER,
			contextEntityType,
		),
		getSchemaForWritablePermissionGrantVariant(
			PermissionGrantGranteeType.USER_GROUP,
			contextEntityType,
		),
	],
);

const writablePermissionGrantSchema: JSONSchemaType<WritablePermissionGrant> = {
	oneOf: allSchemaVariants,
};

const isWritablePermissionGrant = ajv.compile(writablePermissionGrantSchema);

export {
	isWritablePermissionGrant,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	type PermissionGrant,
	type WritablePermissionGrant,
};
