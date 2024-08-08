import { ajv } from '../ajv';
import { Funder } from './Funder';
import { Organization } from './Organization';
import { DataProvider } from './DataProvider';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

export enum SourceType {
	DATA_PROVIDER = 'data_provider',
	FUNDER = 'funder',
	ORGANIZATION = 'organization',
	SYSTEM = 'system',
}

interface SourceBase {
	readonly id: number;
	label: string;
	sourceType: SourceType;
	relatedEntityId: number;
	readonly createdAt: string;
}

interface DataProviderSource extends SourceBase {
	sourceType: SourceType.DATA_PROVIDER;
	readonly relatedEntity: DataProvider;
}

interface FunderSource extends SourceBase {
	sourceType: SourceType.FUNDER;
	readonly realtedEntity: Funder;
}

interface OrganizationSource extends SourceBase {
	sourceType: SourceType.ORGANIZATION;
	readonly realtedEntity: Organization;
}

interface SystemSource extends SourceBase {
	sourceType: SourceType.SYSTEM;
}

type Source =
	| DataProviderSource
	| FunderSource
	| OrganizationSource
	| SystemSource;

type WritableSource = Writable<SourceBase>;

const writableSourceSchema: JSONSchemaType<WritableSource> = {
	type: 'object',
	properties: {
		label: { type: 'string' },
		sourceType: {
			type: 'string',
			enum: Object.values(SourceType),
		},
		relatedEntityId: { type: 'number' },
	},
	required: ['label', 'sourceType', 'relatedEntityId'],
};

const isWritableSource = ajv.compile(writableSourceSchema);

export { Source, WritableSource, isWritableSource };
