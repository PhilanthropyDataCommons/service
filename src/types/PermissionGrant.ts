import { ajv } from '../ajv';
import { BaseFieldCategory } from './BaseField';
import { keycloakIdSchema } from './KeycloakId';
import { PermissionGrantGranteeType } from './PermissionGrantGranteeType';
import { permissionGrantVerbSchema } from './PermissionGrantVerb';
import type { KeycloakId } from './KeycloakId';
import type { PermissionGrantVerb } from './PermissionGrantVerb';
import type { Writable } from './Writable';

enum PermissionGrantEntityKeyType {
	ID = 'id',
	SHORT_CODE = 'shortCode',
}

const jsonSchemaTypeForEntityKeyType: Record<
	PermissionGrantEntityKeyType,
	string
> = {
	[PermissionGrantEntityKeyType.ID]: 'integer',
	[PermissionGrantEntityKeyType.SHORT_CODE]: 'string',
};

const getJsonSchemaTypeForEntityKeyType = (
	keyType: PermissionGrantEntityKeyType,
): string => jsonSchemaTypeForEntityKeyType[keyType];

interface EntityKeyValueType {
	[PermissionGrantEntityKeyType.ID]: number;
	[PermissionGrantEntityKeyType.SHORT_CODE]: string;
}

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

interface ContextEntityKeyProperty {
	keyName: string;
	keyType: PermissionGrantEntityKeyType;
}

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
	ContextEntityKeyProperty
>;

const getContextEntityKeyProperties = (
	entityType: PermissionGrantEntityType,
): ContextEntityKeyProperty => contextEntityKeyProperties[entityType];

interface SupportedConditions {
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: {
		field: 'baseFieldCategory';
		operator: 'in';
		value: BaseFieldCategory[];
	};
}

type ConditionsByPermissionGrantEntityType = {
	[T in PermissionGrantEntityType]: T extends keyof SupportedConditions
		? SupportedConditions[T]
		: never;
};

const allowedScopesForContextEntityType = {
	[PermissionGrantEntityType.CHANGEMAKER]: [
		PermissionGrantEntityType.CHANGEMAKER,
		PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
		PermissionGrantEntityType.PROPOSAL,
		PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
	],
	[PermissionGrantEntityType.FUNDER]: [
		PermissionGrantEntityType.FUNDER,
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

const getAllowedScopesForContextEntityType = (
	entityType: PermissionGrantEntityType,
): readonly PermissionGrantEntityType[] =>
	allowedScopesForContextEntityType[entityType];

type ScopesByPermissionGrantEntityType = {
	[T in PermissionGrantEntityType]: (typeof allowedScopesForContextEntityType)[T][number];
};

type ConditionsForScopes<S extends PermissionGrantEntityType> =
	| (S extends keyof ConditionsByPermissionGrantEntityType
			? Pick<ConditionsByPermissionGrantEntityType, S>
			: never)
	| null;

type ContextEntityKeysByPermissionGrantEntityType = {
	[T in PermissionGrantEntityType]: Record<
		(typeof contextEntityKeyProperties)[T]['keyName'],
		EntityKeyValueType[(typeof contextEntityKeyProperties)[T]['keyType']]
	>;
};

interface PermissionGrantBase {
	readonly id: number;
	granteeType: PermissionGrantGranteeType;
	contextEntityType: PermissionGrantEntityType;
	scope: PermissionGrantEntityType[];
	verbs: PermissionGrantVerb[];
	conditions?: Partial<ConditionsByPermissionGrantEntityType> | null;
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
}

interface PermissionGrantWithUserGrantee extends PermissionGrantBase {
	granteeType: PermissionGrantGranteeType.USER;
	granteeUserKeycloakUserId: KeycloakId;
}

interface PermissionGrantWithUserGroupGrantee extends PermissionGrantBase {
	granteeType: PermissionGrantGranteeType.USER_GROUP;
	granteeKeycloakOrganizationId: KeycloakId;
}

type PermissionGrantWithGrantee =
	| PermissionGrantWithUserGrantee
	| PermissionGrantWithUserGroupGrantee;

type ScopedPermissionGrant<T extends PermissionGrantEntityType> =
	PermissionGrantWithGrantee &
		ContextEntityKeysByPermissionGrantEntityType[T] & {
			contextEntityType: T;
			scope: Array<ScopesByPermissionGrantEntityType[T]>;
			conditions?: ConditionsForScopes<ScopesByPermissionGrantEntityType[T]>;
		};

type PermissionGrant = {
	[T in PermissionGrantEntityType]: ScopedPermissionGrant<T>;
}[PermissionGrantEntityType];

type WritablePermissionGrant = Writable<PermissionGrant>;

const getSchemaFragmentForContextEntityType = (
	contextEntityType: PermissionGrantEntityType,
): { properties: Record<string, object>; required: string[] } => {
	const { keyName, keyType } = getContextEntityKeyProperties(contextEntityType);
	return {
		properties: {
			contextEntityType: {
				type: 'string',
				const: contextEntityType,
			},
			[keyName]: { type: getJsonSchemaTypeForEntityKeyType(keyType) },
		},
		required: ['contextEntityType', keyName],
	};
};

const getSchemaFragmentForGranteeType = (
	granteeType: PermissionGrantGranteeType,
): { properties: Record<string, object>; required: string[] } => {
	switch (granteeType) {
		case PermissionGrantGranteeType.USER:
			return {
				properties: {
					granteeType: {
						type: 'string',
						const: PermissionGrantGranteeType.USER,
					},
					granteeUserKeycloakUserId: keycloakIdSchema,
				},
				required: ['granteeType', 'granteeUserKeycloakUserId'],
			};
		case PermissionGrantGranteeType.USER_GROUP:
			return {
				properties: {
					granteeType: {
						type: 'string',
						const: PermissionGrantGranteeType.USER_GROUP,
					},
					granteeKeycloakOrganizationId: keycloakIdSchema,
				},
				required: ['granteeType', 'granteeKeycloakOrganizationId'],
			};
	}
};

const conditionSchemaForScope: {
	[K in keyof SupportedConditions]: object;
} = {
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: {
		type: 'object',
		properties: {
			field: {
				type: 'string',
				enum: ['baseFieldCategory'],
			},
			operator: {
				type: 'string',
				enum: ['in'],
			},
			value: {
				type: 'array',
				items: {
					type: 'string',
					enum: Object.values(BaseFieldCategory),
				},
				minItems: 1,
			},
		},
		required: ['field', 'operator', 'value'],
		additionalProperties: false,
	},
};

const getConditionsSchemaForScopes = (
	scopes: readonly PermissionGrantEntityType[],
): object => {
	const scopeSet = new Set<string>(scopes);
	const properties = Object.fromEntries(
		Object.entries(conditionSchemaForScope).filter(([key]) =>
			scopeSet.has(key),
		),
	);
	return {
		type: 'object',
		properties,
		additionalProperties: false,
		nullable: true,
	};
};

const getSchemaForWritablePermissionGrantVariant = (
	granteeType: PermissionGrantGranteeType,
	contextEntityType: PermissionGrantEntityType,
): object => {
	const schemaFragmentForContextEntityType =
		getSchemaFragmentForContextEntityType(contextEntityType);
	const schemaFragmentForGranteeType =
		getSchemaFragmentForGranteeType(granteeType);
	const allowedScopes = getAllowedScopesForContextEntityType(contextEntityType);

	return {
		type: 'object',
		properties: {
			scope: {
				type: 'array',
				items: {
					type: 'string',
					enum: allowedScopes,
				},
				minItems: 1,
			},
			verbs: {
				type: 'array',
				items: permissionGrantVerbSchema,
				minItems: 1,
			},
			conditions: getConditionsSchemaForScopes(allowedScopes),
			...schemaFragmentForGranteeType.properties,
			...schemaFragmentForContextEntityType.properties,
		},
		required: [
			'scope',
			'verbs',
			...schemaFragmentForGranteeType.required,
			...schemaFragmentForContextEntityType.required,
		],
		additionalProperties: false,
	};
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

const writablePermissionGrantSchema = {
	oneOf: allSchemaVariants,
};

const isWritablePermissionGrant = ajv.compile<WritablePermissionGrant>(
	writablePermissionGrantSchema,
);

export {
	isWritablePermissionGrant,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	type PermissionGrant,
	type WritablePermissionGrant,
};
