import { ajv } from '../ajv';
import {
	baseFieldLocalizationSchema,
	BaseFieldLocalization,
} from './BaseFieldLocalization';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';

export enum BaseFieldDataType {
	STRING = 'string',
	NUMBER = 'number',
	PHONE_NUMBER = 'phone_number',
	EMAIL = 'email',
	URL = 'url',
	BOOLEAN = 'boolean',
	CURRENCY = 'currency',
}

export enum BaseFieldScope {
	PROPOSAL = 'proposal',
	ORGANIZATION = 'organization',
}

interface BaseField {
	readonly shortCode: ShortCode;
	label: string;
	description: string;
	dataType: BaseFieldDataType;
	scope: BaseFieldScope;
	valueRelevanceHours: number | null;
	readonly localizations: Record<string, BaseFieldLocalization>;
	readonly createdAt: string;
}

const baseFieldSchema: JSONSchemaType<BaseField> = {
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
		valueRelevanceHours: {
			type: 'number',
			minimum: 0,
			nullable: true as false, // see https://github.com/ajv-validator/ajv/issues/2163
		},
		localizations: {
			type: 'object',
			additionalProperties: baseFieldLocalizationSchema,
			required: [],
		},
		createdAt: {
			type: 'string',
		},
	},
	required: [
		'label',
		'description',
		'shortCode',
		'dataType',
		'scope',
		'valueRelevanceHours',
		'localizations',
		'createdAt',
	],
	additionalProperties: true,
};

const isBaseField = ajv.compile(baseFieldSchema);

type WritableBaseField = Writable<BaseField>;

type InternallyWritableBaseField = WritableBaseField &
	Pick<BaseField, 'shortCode'>;

const writableBaseFieldSchema: JSONSchemaType<WritableBaseField> = {
	type: 'object',
	properties: {
		label: {
			type: 'string',
		},
		description: {
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
		valueRelevanceHours: {
			type: 'number',
			minimum: 0,
			nullable: true as false, // see https://github.com/ajv-validator/ajv/issues/2163
		},
	},
	required: [
		'label',
		'description',
		'dataType',
		'scope',
		'valueRelevanceHours',
	],
};

const isWritableBaseField = ajv.compile(writableBaseFieldSchema);

export {
	type BaseField,
	baseFieldSchema,
	isBaseField,
	type InternallyWritableBaseField,
	type WritableBaseField,
	isWritableBaseField,
	writableBaseFieldSchema,
};
