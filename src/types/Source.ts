import { ajv } from '../ajv';
import { idSchema } from './Id';
import type { Funder } from './Funder';
import type { Changemaker } from './Changemaker';
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
	readonly changemaker: Changemaker;
}

type Source = DataProviderSource | FunderSource | ChangemakerSource;

type WritableSource = Writable<Source>;

const writableSourceSchema: JSONSchemaType<WritableSource> = {
	type: 'object',
	required: [],
	allOf: [
		{
			type: 'object',
			properties: {
				label: { type: 'string' },
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

export { type Source, type WritableSource, isWritableSource };
