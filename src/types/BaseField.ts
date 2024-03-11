import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface BaseField {
	readonly id: number;
	label: string;
	description: string;
	shortCode: string;
	dataType: string;
	readonly createdAt: Date;
}

type WritableBaseField = Writable<BaseField>;

const writableBaseFieldSchema: JSONSchemaType<WritableBaseField> = {
	type: 'object',
	properties: {
		label: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		shortCode: {
			type: 'string',
		},
		dataType: {
			type: 'string',
		},
	},
	required: ['label', 'description', 'shortCode', 'dataType'],
};

const isWritableBaseField = ajv.compile(writableBaseFieldSchema);

export {
	BaseField,
	isWritableBaseField,
	WritableBaseField,
	writableBaseFieldSchema,
};
