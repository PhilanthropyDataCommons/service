import { PermissionGrantEntityKeyType } from './PermissionGrantEntityKeyType';
import type { JSONSchemaType } from 'ajv';

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

const permissionGrantEntityTypeSchema: JSONSchemaType<PermissionGrantEntityType> =
	{
		type: 'string',
		enum: Object.values(PermissionGrantEntityType),
	};

interface ContextEntityKeyProperty {
	keyName: string;
	keyType: PermissionGrantEntityKeyType;
}

const contextEntityKeyProperties: Record<
	PermissionGrantEntityType,
	ContextEntityKeyProperty
> = {
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
};

const getContextEntityKeyProperties = (
	entityType: PermissionGrantEntityType,
): ContextEntityKeyProperty => contextEntityKeyProperties[entityType];

const allowedScopesForContextEntityType: Record<
	PermissionGrantEntityType,
	PermissionGrantEntityType[]
> = {
	[PermissionGrantEntityType.CHANGEMAKER]: [
		PermissionGrantEntityType.CHANGEMAKER,
	],
	[PermissionGrantEntityType.FUNDER]: [PermissionGrantEntityType.FUNDER],
	[PermissionGrantEntityType.DATA_PROVIDER]: [
		PermissionGrantEntityType.DATA_PROVIDER,
	],
	[PermissionGrantEntityType.OPPORTUNITY]: [
		PermissionGrantEntityType.OPPORTUNITY,
	],
	[PermissionGrantEntityType.PROPOSAL]: [PermissionGrantEntityType.PROPOSAL],
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
};

const getAllowedScopesForContextEntityType = (
	entityType: PermissionGrantEntityType,
): PermissionGrantEntityType[] => allowedScopesForContextEntityType[entityType];

export {
	getAllowedScopesForContextEntityType,
	getContextEntityKeyProperties,
	PermissionGrantEntityType,
	permissionGrantEntityTypeSchema,
};
