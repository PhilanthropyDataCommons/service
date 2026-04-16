import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';

interface CopyBaseFieldsJobPayload {
	baseFieldsCopyTaskId: Id;
}

const copyBaseFieldsJobPayloadSchema: JSONSchemaType<CopyBaseFieldsJobPayload> =
	{
		type: 'object',
		properties: {
			baseFieldsCopyTaskId: idSchema,
		},
		required: ['baseFieldsCopyTaskId'],
	};

const isCopyBaseFieldsJobPayload = ajv.compile(copyBaseFieldsJobPayloadSchema);

export {
	type CopyBaseFieldsJobPayload,
	copyBaseFieldsJobPayloadSchema,
	isCopyBaseFieldsJobPayload,
};
