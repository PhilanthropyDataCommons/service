import { ajv } from '../ajv';
import { BaseFieldCategory } from './BaseField';
import { keycloakIdSchema } from './KeycloakId';
import { getJsonSchemaTypeForEntityKeyType } from './PermissionGrantEntityKeyType';
import {
	getAllowedScopesForContextEntityType,
	getContextEntityKeyProperties,
	PermissionGrantEntityType,
} from './PermissionGrantEntityType';
import { PermissionGrantGranteeType } from './PermissionGrantGranteeType';
import { permissionGrantVerbSchema } from './PermissionGrantVerb';
import type { KeycloakId } from './KeycloakId';
import type { PermissionGrantVerb } from './PermissionGrantVerb';
import type { Writable } from './Writable';

interface PermissionGrantCondition {
	field: string;
	operator: string;
	value: unknown;
}

interface ConditionsByPermissionGrantEntityType
	extends Record<PermissionGrantEntityType, PermissionGrantCondition> {
	[PermissionGrantEntityType.CHANGEMAKER]: never;
	[PermissionGrantEntityType.FUNDER]: never;
	[PermissionGrantEntityType.DATA_PROVIDER]: never;
	[PermissionGrantEntityType.OPPORTUNITY]: never;
	[PermissionGrantEntityType.PROPOSAL]: never;
	[PermissionGrantEntityType.PROPOSAL_VERSION]: never;
	[PermissionGrantEntityType.APPLICATION_FORM]: never;
	[PermissionGrantEntityType.APPLICATION_FORM_FIELD]: never;
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: {
		field: 'baseFieldCategory';
		operator: 'in';
		value: BaseFieldCategory[];
	};
	[PermissionGrantEntityType.SOURCE]: never;
	[PermissionGrantEntityType.BULK_UPLOAD]: never;
	[PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE]: never;
}

interface ScopesByPermissionGrantEntityType
	extends Record<PermissionGrantEntityType, PermissionGrantEntityType> {
	[PermissionGrantEntityType.CHANGEMAKER]:
		| PermissionGrantEntityType.CHANGEMAKER
		| PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE
		| PermissionGrantEntityType.PROPOSAL
		| PermissionGrantEntityType.PROPOSAL_FIELD_VALUE;
	[PermissionGrantEntityType.FUNDER]:
		| PermissionGrantEntityType.FUNDER
		| PermissionGrantEntityType.PROPOSAL
		| PermissionGrantEntityType.PROPOSAL_FIELD_VALUE;
	[PermissionGrantEntityType.DATA_PROVIDER]: PermissionGrantEntityType.DATA_PROVIDER;
	[PermissionGrantEntityType.OPPORTUNITY]:
		| PermissionGrantEntityType.OPPORTUNITY
		| PermissionGrantEntityType.PROPOSAL
		| PermissionGrantEntityType.PROPOSAL_FIELD_VALUE;
	[PermissionGrantEntityType.PROPOSAL]:
		| PermissionGrantEntityType.PROPOSAL
		| PermissionGrantEntityType.PROPOSAL_FIELD_VALUE;
	[PermissionGrantEntityType.PROPOSAL_VERSION]: PermissionGrantEntityType.PROPOSAL_VERSION;
	[PermissionGrantEntityType.APPLICATION_FORM]: PermissionGrantEntityType.APPLICATION_FORM;
	[PermissionGrantEntityType.APPLICATION_FORM_FIELD]: PermissionGrantEntityType.APPLICATION_FORM_FIELD;
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: PermissionGrantEntityType.PROPOSAL_FIELD_VALUE;
	[PermissionGrantEntityType.SOURCE]: PermissionGrantEntityType.SOURCE;
	[PermissionGrantEntityType.BULK_UPLOAD]: PermissionGrantEntityType.BULK_UPLOAD;
	[PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE]: PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE;
}

type ConditionsForScopes<S extends PermissionGrantEntityType> =
	| (S extends keyof ConditionsByPermissionGrantEntityType
			? Pick<ConditionsByPermissionGrantEntityType, S>
			: never)
	| null;

interface ContextEntityKeysByPermissionGrantEntityType
	extends Record<PermissionGrantEntityType, object> {
	[PermissionGrantEntityType.CHANGEMAKER]: { changemakerId: number };
	[PermissionGrantEntityType.FUNDER]: { funderShortCode: string };
	[PermissionGrantEntityType.DATA_PROVIDER]: { dataProviderShortCode: string };
	[PermissionGrantEntityType.OPPORTUNITY]: { opportunityId: number };
	[PermissionGrantEntityType.PROPOSAL]: { proposalId: number };
	[PermissionGrantEntityType.PROPOSAL_VERSION]: { proposalVersionId: number };
	[PermissionGrantEntityType.APPLICATION_FORM]: {
		applicationFormId: number;
	};
	[PermissionGrantEntityType.APPLICATION_FORM_FIELD]: {
		applicationFormFieldId: number;
	};
	[PermissionGrantEntityType.PROPOSAL_FIELD_VALUE]: {
		proposalFieldValueId: number;
	};
	[PermissionGrantEntityType.SOURCE]: { sourceId: number };
	[PermissionGrantEntityType.BULK_UPLOAD]: { bulkUploadTaskId: number };
	[PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE]: {
		changemakerFieldValueId: number;
	};
}

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

const conditionSchemaForScope: Partial<
	Record<PermissionGrantEntityType, object>
> = {
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
	scopes: PermissionGrantEntityType[],
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
	PermissionGrantGranteeType,
	type PermissionGrant,
	type ConditionsByPermissionGrantEntityType,
	type WritablePermissionGrant,
};
