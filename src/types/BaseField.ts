import { ajv } from '../ajv';
import type { BaseFieldLocalization } from './BaseFieldLocalization';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

export enum BaseFieldDataType {
	STRING = 'string',
	NUMBER = 'number',
	PHONE_NUMBER = 'phone_number',
	EMAIL = 'email',
	URL = 'url',
	BOOLEAN = 'boolean',
}

export enum BaseFieldScope {
	PROPOSAL = 'proposal',
	ORGANIZATION = 'organization',
}

interface BaseField {
	readonly id: number;
	label: string;
	description: string;
	shortCode: string;
	dataType: BaseFieldDataType;
	scope: BaseFieldScope;
	readonly localizations: Record<string, BaseFieldLocalization>;
	readonly createdAt: string;
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
			enum: Object.values(BaseFieldDataType),
		},
		scope: {
			type: 'string',
			enum: Object.values(BaseFieldScope),
		},
	},
	required: ['label', 'description', 'shortCode', 'dataType', 'scope'],
};

const isWritableBaseField = ajv.compile(writableBaseFieldSchema);

export {
	BaseField,
	isWritableBaseField,
	WritableBaseField,
	writableBaseFieldSchema,
};
