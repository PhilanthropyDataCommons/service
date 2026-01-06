import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

enum PermissionEntityType {
	CHANGEMAKER = 'changemaker',
	FUNDER = 'funder',
	DATA_PROVIDER = 'dataProvider',
	OPPORTUNITY = 'opportunity',
	PROPOSAL = 'proposal',
	PROPOSAL_VERSION = 'proposalVersion',
	APPLICATION_FORM = 'applicationForm',
	APPLICATION_FORM_FIELD = 'applicationFormField',
	PROPOSAL_FIELD_VALUE = 'proposalFieldValue',
	BULK_UPLOAD = 'bulkUpload',
	SOURCE = 'source',
	OUTCOME = 'outcome',
	BASE_FIELD = 'baseField',
	EXTERNAL_FIELD_VALUE = 'externalFieldValue',
}

const permissionEntityTypeSchema: JSONSchemaType<PermissionEntityType> = {
	type: 'string',
	enum: Object.values(PermissionEntityType),
};

const isPermissionEntityType = ajv.compile(permissionEntityTypeSchema);

export {
	PermissionEntityType,
	isPermissionEntityType,
	permissionEntityTypeSchema,
};
