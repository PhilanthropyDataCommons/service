import { ajv } from '../ajv';
import {
	writableBaseFieldLocalizationWithBaseFieldContextSchema,
	type BaseFieldLocalization,
	type WritableBaseFieldLocalizationWithBaseFieldContext,
} from './BaseFieldLocalization';
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
	shortCode: string;
	dataType: BaseFieldDataType;
	scope: BaseFieldScope;
	readonly localizations: BaseFieldLocalization[];
	readonly createdAt: string;
}

type WritableBaseField = Writable<BaseField>;

type WritableBaseFieldWithLocalizations = WritableBaseField & {
	localizations: WritableBaseFieldLocalizationWithBaseFieldContext[];
};

const writableBaseFieldSchema: JSONSchemaType<WritableBaseField> = {
	type: 'object',
	properties: {
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
	required: ['shortCode', 'dataType', 'scope'],
	additionalProperties: false,
};

const writableBaseFieldWithLocalizationsSchema: JSONSchemaType<WritableBaseFieldWithLocalizations> =
	{
		type: 'object',
		properties: {
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
				type: 'array',
				items: writableBaseFieldLocalizationWithBaseFieldContextSchema,
				minItems: 1,
			},
		},
		required: ['shortCode', 'dataType', 'scope', 'localizations'],
		additionalProperties: false,
	};

const isWritableBaseField = ajv.compile(writableBaseFieldSchema);

const isWritableBaseFieldWithLocalizations = ajv.compile(
	writableBaseFieldWithLocalizationsSchema,
);

export {
	BaseField,
	WritableBaseFieldWithLocalizations,
	WritableBaseField,
	writableBaseFieldSchema,
	isWritableBaseField,
	isWritableBaseFieldWithLocalizations,
	writableBaseFieldWithLocalizationsSchema,
};
