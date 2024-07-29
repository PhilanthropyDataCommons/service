import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface BaseFieldLocalization {
	baseFieldId: number;
	language: string;
	label: string;
	description?: string;
	readonly createdAt: string;
}

type WritableBaseFieldLocalization = Writable<BaseFieldLocalization>;

const writableBaseFieldLocalizationSchema: JSONSchemaType<WritableBaseFieldLocalization> =
	{
		type: 'object',
		properties: {
			baseFieldId: {
				type: 'number',
			},
			language: {
				type: 'string',
			},
			label: {
				type: 'string',
			},
			description: {
				type: 'string',
				nullable: true,
			},
		},
		required: ['language', 'label', 'baseFieldId'],
	};

const isWritableBaseFieldLocalization = ajv.compile(
	writableBaseFieldLocalizationSchema,
);

type WritableBaseFieldLocalizationWithBaseFieldContext = Omit<
	WritableBaseFieldLocalization,
	'baseFieldId'
>;
const writableBaseFieldLocalizationWithBaseFieldContextSchema: JSONSchemaType<WritableBaseFieldLocalizationWithBaseFieldContext> =
	{
		type: 'object',
		properties: {
			language: {
				type: 'string',
			},
			label: {
				type: 'string',
			},
			description: {
				type: 'string',
				nullable: true,
			},
		},
		required: ['language', 'label'],
	};

const iswritableBaseFieldLocalizationWithBaseFieldContext = ajv.compile(
	writableBaseFieldLocalizationWithBaseFieldContextSchema,
);

type WritableBaseFieldLocalizationWithBaseFieldAndLanguageContext = Omit<
	WritableBaseFieldLocalization,
	'baseFieldId' | 'language'
>;
const writableBaseFieldLocalizationWithBaseFieldAndLanguageContextSchema: JSONSchemaType<WritableBaseFieldLocalizationWithBaseFieldAndLanguageContext> =
	{
		type: 'object',
		properties: {
			label: {
				type: 'string',
			},
			description: {
				type: 'string',
				nullable: true,
			},
		},
		required: ['label'],
	};

const iswritableBaseFieldLocalizationWithBaseFieldAndLanguageContext =
	ajv.compile(
		writableBaseFieldLocalizationWithBaseFieldAndLanguageContextSchema,
	);

export {
	BaseFieldLocalization,
	WritableBaseFieldLocalization,
	WritableBaseFieldLocalizationWithBaseFieldContext,
	WritableBaseFieldLocalizationWithBaseFieldAndLanguageContext,
	writableBaseFieldLocalizationSchema,
	writableBaseFieldLocalizationWithBaseFieldContextSchema,
	writableBaseFieldLocalizationWithBaseFieldAndLanguageContextSchema,
	iswritableBaseFieldLocalizationWithBaseFieldContext,
	isWritableBaseFieldLocalization,
	iswritableBaseFieldLocalizationWithBaseFieldAndLanguageContext,
};
