import { ajv } from '../ajv';
import { BaseFieldCategory } from './BaseField';
import { keycloakIdSchema } from './KeycloakId';
import {
	PermissionGrantGranteeType,
	permissionGrantGranteeTypeSchema,
} from './PermissionGrantGranteeType';
import { permissionGrantVerbSchema } from './PermissionGrantVerb';
import type { TypeGuardWithAjvErrors } from '../ajv';
import type { KeycloakId } from './KeycloakId';
import type { PermissionGrantVerb } from './PermissionGrantVerb';
import type { Writable } from './Writable';
import type { ValidateFunction } from 'ajv';

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

interface PermissionGrantCondition {
	field: string;
	operator: string;
	value: string[];
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
	{ keyName: string; keyType: PermissionGrantEntityKeyType }
>;

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

interface UnkeyedPermissionGrant {
	readonly id: number;
	verbs: PermissionGrantVerb[];
	readonly createdBy: KeycloakId;
	readonly createdAt: string;
	contextEntityType: PermissionGrantEntityType;
	granteeType: PermissionGrantGranteeType;
	scope: PermissionGrantEntityType[];
	conditions?: Partial<
		Record<PermissionGrantEntityType, PermissionGrantCondition>
	> | null;
}

type GranteeKeysByGranteeType = {
	[G in PermissionGrantGranteeType]: Record<
		(typeof granteeKeyProperties)[G]['keyName'],
		KeycloakId
	>;
};

type ContextEntityKeysByContextEntityType = {
	[T in PermissionGrantEntityType]: Record<
		(typeof contextEntityKeyProperties)[T]['keyName'],
		PermissionGrantEntityKeyValueType[(typeof contextEntityKeyProperties)[T]['keyType']]
	>;
};

type PermissionGrantGranteeKeyVariant<G extends PermissionGrantGranteeType> =
	GranteeKeysByGranteeType[G] & {
		granteeType: G;
	};

type PermissionGrantContextEntityKeyVariant<
	C extends PermissionGrantEntityType,
> = ContextEntityKeysByContextEntityType[C] & {
	contextEntityType: C;
};

type PermissionGrant = UnkeyedPermissionGrant &
	{
		[C in PermissionGrantEntityType]: PermissionGrantContextEntityKeyVariant<C>;
	}[PermissionGrantEntityType] &
	{
		[G in PermissionGrantGranteeType]: PermissionGrantGranteeKeyVariant<G>;
	}[PermissionGrantGranteeType];

type WritablePermissionGrant = Writable<PermissionGrant>;

type WritableUnkeyedPermissionGrant = Writable<UnkeyedPermissionGrant>;

const jsonSchemaTypeForPermissionGrantEntityKeyType: Record<
	PermissionGrantEntityKeyType,
	string
> = {
	[PermissionGrantEntityKeyType.ID]: 'integer',
	[PermissionGrantEntityKeyType.SHORT_CODE]: 'string',
};

const permissionGrantConditionSchema = {
	type: 'object',
	properties: {
		field: { type: 'string' },
		operator: { type: 'string' },
		value: {
			type: 'array',
			items: { type: 'string' },
			minItems: 1,
		},
	},
	required: ['field', 'operator', 'value'],
	additionalProperties: false,
};

const isWritableUnkeyedPermissionGrant =
	ajv.compile<WritableUnkeyedPermissionGrant>({
		type: 'object',
		properties: {
			contextEntityType: {
				type: 'string',
				enum: Object.values(PermissionGrantEntityType),
			},
			granteeType: permissionGrantGranteeTypeSchema,
			verbs: {
				type: 'array',
				items: permissionGrantVerbSchema,
				minItems: 1,
			},
			scope: {
				type: 'array',
				items: {
					type: 'string',
					enum: Object.values(PermissionGrantEntityType),
				},
				minItems: 1,
			},
			conditions: {
				type: 'object',
				nullable: true,
				properties: Object.fromEntries(
					Object.values(PermissionGrantEntityType).map((entityType) => [
						entityType,
						permissionGrantConditionSchema,
					]),
				),
				additionalProperties: false,
			},
		},
		required: ['contextEntityType', 'granteeType', 'verbs', 'scope'],
	});

const buildContextKeyValidator = (
	contextEntityType: PermissionGrantEntityType,
): ValidateFunction => {
	const {
		[contextEntityType]: { keyName, keyType },
	} = contextEntityKeyProperties;
	return ajv.compile({
		type: 'object',
		properties: {
			[keyName]: {
				type: jsonSchemaTypeForPermissionGrantEntityKeyType[keyType],
			},
		},
		required: [keyName],
	});
};

const buildGranteeKeyValidator = (
	granteeType: PermissionGrantGranteeType,
): ValidateFunction => {
	const {
		[granteeType]: { keyName },
	} = granteeKeyProperties;
	return ajv.compile({
		type: 'object',
		properties: {
			[keyName]: keycloakIdSchema,
		},
		required: [keyName],
	});
};

const isWritablePermissionGrant: TypeGuardWithAjvErrors<
	WritablePermissionGrant
> = (data: unknown): data is WritablePermissionGrant => {
	if (!isWritableUnkeyedPermissionGrant(data)) {
		isWritablePermissionGrant.errors =
			isWritableUnkeyedPermissionGrant.errors ?? null;
		return false;
	}

	const { contextEntityType, granteeType } = data;

	const validateContextKey = buildContextKeyValidator(contextEntityType);
	if (!validateContextKey(data)) {
		isWritablePermissionGrant.errors = validateContextKey.errors ?? null;
		return false;
	}

	const validateGranteeKey = buildGranteeKeyValidator(granteeType);
	if (!validateGranteeKey(data)) {
		isWritablePermissionGrant.errors = validateGranteeKey.errors ?? null;
		return false;
	}

	isWritablePermissionGrant.errors = null;
	return true;
};

const getScopesForContextEntityType = (
	contextEntityType: PermissionGrantEntityType,
): readonly PermissionGrantEntityType[] =>
	contextEntityTypeScopes[contextEntityType];

const getConditionsForScope = (
	scopeKey: PermissionGrantEntityType,
): readonly PermissionGrantCondition[] => scopeConditions[scopeKey];

export {
	getConditionsForScope,
	getScopesForContextEntityType,
	isWritablePermissionGrant,
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	type PermissionGrant,
	type PermissionGrantCondition,
	type WritablePermissionGrant,
	type WritableUnkeyedPermissionGrant,
};
