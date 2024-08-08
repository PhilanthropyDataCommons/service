import { ajv } from '../ajv';
import { Funder } from './Funder';
import { Organization } from './Organization';
import { DataProvider } from './DataProvider';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface SourceBase {
	readonly id: number;
	label: string;
	readonly createdAt: string;
}

interface DataProviderSource extends SourceBase {
	dataProviderShortCode: string;
	readonly dataProvider: DataProvider;
}

interface FunderSource extends SourceBase {
	funderShortCode: string;
	readonly funder: Funder;
}

interface OrganizationSource extends SourceBase {
	organizationId: number;
	readonly organization: Organization;
}

type Source = DataProviderSource | FunderSource | OrganizationSource;

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
						organizationId: { type: 'number' },
					},
					required: ['organizationId'],
				},
			],
		},
	],
};

const isWritableSource = ajv.compile(writableSourceSchema);

export { Source, WritableSource, isWritableSource };
