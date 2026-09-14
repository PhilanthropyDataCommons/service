import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Funder } from './Funder';
import type { ShallowChangemaker } from './Changemaker';
import type { DataProvider } from './DataProvider';
import type { Id } from './Id';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { KeycloakId } from './KeycloakId';

interface SourceBase {
	readonly id: Id;
	label: string;
	readonly createdAt: string;
	readonly createdBy: KeycloakId;
}

interface DataProviderSource extends SourceBase {
	dataProviderShortCode: string;
	readonly dataProvider: DataProvider;
}

interface FunderSource extends SourceBase {
	funderShortCode: string;
	readonly funder: Funder;
}

interface ChangemakerSource extends SourceBase {
	changemakerId: Id;
	readonly changemaker: ShallowChangemaker;
}

type Source = DataProviderSource | FunderSource | ChangemakerSource;

type WritableSource = Writable<Source>;

const sourceLabelSchema: JSONSchemaType<WritableSource['label']> = {
	type: 'string',
};

const writableSourceSchema: JSONSchemaType<WritableSource> = {
	type: 'object',
	required: [],
	allOf: [
		{
			type: 'object',
			properties: {
				label: sourceLabelSchema,
			},
			required: ['label'],
		},
		{
			type: 'object',
			oneOf: [
				{
					type: 'object',
					properties: {
						dataProviderShortCode: { type: 'string' },
					},
					required: ['dataProviderShortCode'],
				},
				{
					type: 'object',
					properties: {
						funderShortCode: { type: 'string' },
					},
					required: ['funderShortCode'],
				},
				{
					type: 'object',
					properties: {
						changemakerId: idSchema,
					},
					required: ['changemakerId'],
				},
			],
		},
	],
};

const isWritableSource = ajv.compile(writableSourceSchema);

type SourcePatch = Partial<Pick<WritableSource, 'label'>>;

const sourcePatchSchema: JSONSchemaType<SourcePatch> = {
	type: 'object',
	properties: {
		label: {
			...sourceLabelSchema,
			/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
			 * AJV's JSONSchemaType does not properly support nullable for patches.
			 * See https://github.com/ajv-validator/ajv/issues/2163
			 */
			nullable: false as true,
		},
	},
	additionalProperties: false,
	minProperties: 1,
};

const isSourcePatch = ajv.compile(sourcePatchSchema);

export {
	type Source,
	type SourcePatch,
	type WritableSource,
	isSourcePatch,
	isWritableSource,
};
