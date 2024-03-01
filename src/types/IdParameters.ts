import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface IdParameters {
	id: number;
}

export const idParameterSchema: JSONSchemaType<IdParameters> = {
	type: 'object',
	properties: {
		id: {
			type: 'integer',
			minimum: 1,
		},
	},
	required: ['id'],
};

export const isIdParameters = ajv.compile(idParameterSchema);
