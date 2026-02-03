import { ajv } from '../ajv';
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

interface PermissionGrantBase {
	readonly id: number;
	granteeType: PermissionGrantGranteeType;
	contextEntityType: PermissionGrantEntityType;
	scope: PermissionGrantEntityType[];
	verbs: PermissionGrantVerb[];
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

type ChangemakerPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.CHANGEMAKER;
	changemakerId: number;
};

type FunderPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.FUNDER;
	funderShortCode: string;
};

type DataProviderPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.DATA_PROVIDER;
	dataProviderShortCode: string;
};

type OpportunityPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.OPPORTUNITY;
	opportunityId: number;
};

type ProposalPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.PROPOSAL;
	proposalId: number;
};

type ProposalVersionPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.PROPOSAL_VERSION;
	proposalVersionId: number;
};

type ApplicationFormPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.APPLICATION_FORM;
	applicationFormId: number;
};

type ApplicationFormFieldPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.APPLICATION_FORM_FIELD;
	applicationFormFieldId: number;
};

type ProposalFieldValuePermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.PROPOSAL_FIELD_VALUE;
	proposalFieldValueId: number;
};

type SourcePermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.SOURCE;
	sourceId: number;
};

type BulkUploadPermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.BULK_UPLOAD;
	bulkUploadTaskId: number;
};

type ChangemakerFieldValuePermissionGrant = PermissionGrantWithGrantee & {
	contextEntityType: PermissionGrantEntityType.CHANGEMAKER_FIELD_VALUE;
	changemakerFieldValueId: number;
};

type PermissionGrant =
	| ChangemakerPermissionGrant
	| FunderPermissionGrant
	| DataProviderPermissionGrant
	| OpportunityPermissionGrant
	| ProposalPermissionGrant
	| ProposalVersionPermissionGrant
	| ApplicationFormPermissionGrant
	| ApplicationFormFieldPermissionGrant
	| ProposalFieldValuePermissionGrant
	| SourcePermissionGrant
	| BulkUploadPermissionGrant
	| ChangemakerFieldValuePermissionGrant;

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
	type WritablePermissionGrant,
};
