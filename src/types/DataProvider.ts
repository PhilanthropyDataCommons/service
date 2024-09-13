import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';

interface DataProvider {
	readonly shortCode: ShortCode;
	name: string;
	readonly createdAt: string;
}

type WritableDataProvider = Writable<DataProvider>;

type InternallyWritableDataProvider = WritableDataProvider &
	Pick<DataProvider, 'shortCode'>;

const writableDataProviderSchema: JSONSchemaType<WritableDataProvider> = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
	},
	required: ['name'],
};

const isWritableDataProvider = ajv.compile(writableDataProviderSchema);

export {
	DataProvider,
	InternallyWritableDataProvider,
	isWritableDataProvider,
	WritableDataProvider,
};
