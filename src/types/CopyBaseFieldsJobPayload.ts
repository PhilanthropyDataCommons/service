import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

interface CopyBaseFieldsJobPayload {
	baseFieldsCopyTaskId: number;
}

const copyBaseFieldsJobPayloadSchema: JSONSchemaType<CopyBaseFieldsJobPayload> =
	{
		type: 'object',
		properties: {
			baseFieldsCopyTaskId: {
				type: 'integer',
			},
		},
		required: ['baseFieldsCopyTaskId'],
	};

const isCopyBaseFieldsJobPayload = ajv.compile(copyBaseFieldsJobPayloadSchema);

export {
	type CopyBaseFieldsJobPayload,
	copyBaseFieldsJobPayloadSchema,
	isCopyBaseFieldsJobPayload,
};
