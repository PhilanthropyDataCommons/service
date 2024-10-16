import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface BaseFieldLocalization {
	readonly baseFieldId: number;
	readonly language: string;
	label: string;
	description: string;
	readonly createdAt: string;
}

const baseFieldLocalizationSchema: JSONSchemaType<BaseFieldLocalization> = {
	type: 'object',
	properties: {
		language: {
			type: 'string',
		},
		baseFieldId: {
			type: 'number',
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
	required: ['description', 'language', 'label', 'baseFieldId', 'createdAt'],
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
	Pick<BaseFieldLocalization, 'baseFieldId' | 'language'>;

const internallyWritableBaseFieldLocalizationSchema: JSONSchemaType<InternallyWritableBaseFieldLocalization> =
	{
		type: 'object',
		properties: {
			language: {
				type: 'string',
			},
			baseFieldId: {
				type: 'number',
			},
			label: {
				type: 'string',
			},
			description: {
				type: 'string',
			},
		},
		required: ['description', 'language', 'label', 'baseFieldId'],
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
