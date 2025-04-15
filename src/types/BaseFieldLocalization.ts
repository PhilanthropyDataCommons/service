import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';

interface BaseFieldLocalization {
	readonly baseFieldShortCode: ShortCode;
	readonly language: string;
	label: string;
	description: string;
	readonly createdAt: string;
}

const baseFieldLocalizationSchema: JSONSchemaType<BaseFieldLocalization> = {
	type: 'object',
	properties: {
		baseFieldShortCode: {
			type: 'string',
		},
		language: {
			type: 'string',
		},
		label: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		createdAt: {
			type: 'string',
		},
	},
	required: [
		'baseFieldShortCode',
		'description',
		'language',
		'label',
		'createdAt',
	],
	additionalProperties: true,
};

type WritableBaseFieldLocalization = Writable<BaseFieldLocalization>;

const writableBaseFieldLocalizationSchema: JSONSchemaType<WritableBaseFieldLocalization> =
	{
		type: 'object',
		properties: {
			label: {
				type: 'string',
			},
			description: {
				type: 'string',
			},
		},
		required: ['label', 'description'],
	};

type InternallyWritableBaseFieldLocalization = Writable<BaseFieldLocalization> &
	Pick<BaseFieldLocalization, 'baseFieldShortCode' | 'language'>;

const internallyWritableBaseFieldLocalizationSchema: JSONSchemaType<InternallyWritableBaseFieldLocalization> =
	{
		type: 'object',
		properties: {
			baseFieldShortCode: {
				type: 'string',
			},
			language: {
				type: 'string',
			},
			label: {
				type: 'string',
			},
			description: {
				type: 'string',
			},
		},
		required: ['baseFieldShortCode', 'description', 'language', 'label'],
		additionalProperties: true,
	};

const isWritableBaseFieldLocalization = ajv.compile(
	writableBaseFieldLocalizationSchema,
);

export {
	BaseFieldLocalization,
	baseFieldLocalizationSchema,
	WritableBaseFieldLocalization,
	InternallyWritableBaseFieldLocalization,
	writableBaseFieldLocalizationSchema,
	internallyWritableBaseFieldLocalizationSchema,
	isWritableBaseFieldLocalization,
};
