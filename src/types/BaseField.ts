import { ajv } from '../ajv';
import { baseFieldLocalizationSchema } from './BaseFieldLocalization';
import type { BaseFieldLocalization } from './BaseFieldLocalization';
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
	FILE = 'file',
}

enum BaseFieldCategory {
	PROJECT = 'project',
	ORGANIZATION = 'organization',
	NEEDS_ASSESSMENT = 'needs_assessment',
	METHODOLOGY = 'methodology',
	BUDGET = 'budget',
	EVALUATION = 'evaluation',
	SUSTAINABILIY = 'sustainability',
	PARTNERSHIPS = 'partnerships',
	OUTCOMES = 'outcomes',
	TECHNICAL = 'technical',
	UNCATEGORIZED = 'uncategorized',
}

enum BaseFieldSensitivityClassification {
	PUBLIC = 'public',
	RESTRICTED = 'restricted',
	FORBIDDEN = 'forbidden',
}

interface BaseField {
	readonly shortCode: ShortCode;
	label: string;
	description: string;
	dataType: BaseFieldDataType;
	category: BaseFieldCategory;
	valueRelevanceHours: number | null;
	sensitivityClassification: BaseFieldSensitivityClassification;
	readonly localizations: Record<string, BaseFieldLocalization>;
	readonly createdAt: string;
}
export const baseFieldSensitivityClassificationSchema: JSONSchemaType<BaseFieldSensitivityClassification> =
	{
		type: 'string',
		enum: Object.values(BaseFieldSensitivityClassification),
	};

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
		category: {
			type: 'string',
			enum: Object.values(BaseFieldCategory),
		},
		valueRelevanceHours: {
			type: 'number',
			minimum: 0,
			/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
			 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
			 * See: https://github.com/ajv-validator/ajv/issues/2163
			 */
			nullable: true as false,
		},
		sensitivityClassification: baseFieldSensitivityClassificationSchema,
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
		'category',
		'valueRelevanceHours',
		'sensitivityClassification',
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
		category: {
			type: 'string',
			enum: Object.values(BaseFieldCategory),
		},
		valueRelevanceHours: {
			type: 'number',
			minimum: 0,
			/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
			 * This is a gross workaround for the fact that AJV does not support nullable types in TypeScript.
			 * See: https://github.com/ajv-validator/ajv/issues/2163
			 */
			nullable: true as false,
		},
		sensitivityClassification: baseFieldSensitivityClassificationSchema,
	},
	required: [
		'label',
		'description',
		'dataType',
		'category',
		'valueRelevanceHours',
		'sensitivityClassification',
	],
};

const isWritableBaseField = ajv.compile(writableBaseFieldSchema);

const isBaseFieldSensitivityClassification = ajv.compile(
	baseFieldSensitivityClassificationSchema,
);

export {
	type BaseField,
	BaseFieldSensitivityClassification,
	BaseFieldCategory,
	baseFieldSchema,
	isBaseField,
	isBaseFieldSensitivityClassification,
	type InternallyWritableBaseField,
	type WritableBaseField,
	isWritableBaseField,
	writableBaseFieldSchema,
};
