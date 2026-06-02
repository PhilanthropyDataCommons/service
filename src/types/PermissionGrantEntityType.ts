import type { Id } from './Id';

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
	TERMINOLOGY_SET = 'terminologySet',
	ANY = 'any',
}

enum PermissionGrantEntityKeyType {
	ID = 'id',
	SHORT_CODE = 'shortCode',
}

interface PermissionGrantEntityKeyValueType {
	[PermissionGrantEntityKeyType.ID]: Id;
	[PermissionGrantEntityKeyType.SHORT_CODE]: string;
}

const jsonSchemaTypeForPermissionGrantEntityKeyType: Record<
	PermissionGrantEntityKeyType,
	string
> = {
	[PermissionGrantEntityKeyType.ID]: 'integer',
	[PermissionGrantEntityKeyType.SHORT_CODE]: 'string',
};

// The primary key name + data type for each context entity. The `ANY`
// context entity has no key; it is omitted here.
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
	[PermissionGrantEntityType.TERMINOLOGY_SET]: {
		keyName: 'terminologySetId',
		keyType: PermissionGrantEntityKeyType.ID,
	},
} as const satisfies Omit<
	Record<
		PermissionGrantEntityType,
		{ keyName: string; keyType: PermissionGrantEntityKeyType }
	>,
	PermissionGrantEntityType.ANY
>;

type PermissionGrantKeyedContextEntityType =
	keyof typeof contextEntityKeyProperties;

const isPermissionGrantKeyedContextEntityType = (
	contextEntityType: PermissionGrantEntityType,
): contextEntityType is PermissionGrantKeyedContextEntityType =>
	contextEntityType in contextEntityKeyProperties;

// Scopes that are valid against any context entity type, appended to a
// context's native scopes by `getScopesForContextEntityType` below.
const universalScopes = [PermissionGrantEntityType.ANY] as const;

const contextEntityTypeNativeScopes = {
	[PermissionGrantEntityType.CHANGEMAKER]: [
		PermissionGrantEntityType.CHANGEMAKER,
		PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE,
		PermissionGrantEntityType.PROPOSAL,
		PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
	],
	[PermissionGrantEntityType.FUNDER]: [
		PermissionGrantEntityType.FUNDER,
		PermissionGrantEntityType.OPPORTUNITY,
		PermissionGrantEntityType.APPLICATION_FORM,
		PermissionGrantEntityType.PROPOSAL,
		PermissionGrantEntityType.PROPOSAL_FIELD_VALUE,
		PermissionGrantEntityType.TERMINOLOGY_SET,
	],
	[PermissionGrantEntityType.DATA_PROVIDER]: [
		PermissionGrantEntityType.DATA_PROVIDER,
	],
	[PermissionGrantEntityType.OPPORTUNITY]: [
		PermissionGrantEntityType.OPPORTUNITY,
		PermissionGrantEntityType.APPLICATION_FORM,
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
	[PermissionGrantEntityType.TERMINOLOGY_SET]: [
		PermissionGrantEntityType.TERMINOLOGY_SET,
	],
	[PermissionGrantEntityType.ANY]: [],
} as const satisfies Record<
	PermissionGrantEntityType,
	readonly PermissionGrantEntityType[]
>;

const getScopesForContextEntityType = (
	contextEntityType: PermissionGrantEntityType,
): readonly PermissionGrantEntityType[] => [
	...contextEntityTypeNativeScopes[contextEntityType],
	...universalScopes,
];

export {
	contextEntityKeyProperties,
	getScopesForContextEntityType,
	isPermissionGrantKeyedContextEntityType,
	jsonSchemaTypeForPermissionGrantEntityKeyType,
	PermissionGrantEntityKeyType,
	PermissionGrantEntityType,
	type PermissionGrantEntityKeyValueType,
	type PermissionGrantKeyedContextEntityType,
};
