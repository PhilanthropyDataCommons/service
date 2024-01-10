import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';

export interface BaseField {
	id: number;
	label: string;
	description: string;
	shortCode: string;
	dataType: string;
	createdAt: Date;
}

export type BaseFieldWrite = Omit<BaseField, 'createdAt' | 'id'>;

export const baseFieldWriteSchema: JSONSchemaType<BaseFieldWrite> = {
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

export const isBaseFieldWrite = ajv.compile(baseFieldWriteSchema);
