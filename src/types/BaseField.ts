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
	},
	required: ['label', 'description', 'dataType', 'scope'],
};

const internallyWritableBaseFieldSchema: JSONSchemaType<InternallyWritableBaseField> =
	{
		type: 'object',
		properties: {
			shortCode: {
				type: 'string',
			},
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
		},
		required: ['shortCode', 'label', 'description', 'dataType', 'scope'],
	};

const isWritableBaseField = ajv.compile(writableBaseFieldSchema);

const isInternallyWritableBaseField = ajv.compile(
	internallyWritableBaseFieldSchema,
);

export {
	BaseField,
	baseFieldSchema,
	isBaseField,
	InternallyWritableBaseField,
	internallyWritableBaseFieldSchema,
	isInternallyWritableBaseField,
	WritableBaseField,
	isWritableBaseField,
	writableBaseFieldSchema,
};
