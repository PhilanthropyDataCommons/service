import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface DataProvider {
	readonly id: number;
	name: string;
	readonly createdAt: string;
}

type WritableDataProvider = Writable<DataProvider>;

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

export { DataProvider, isWritableDataProvider, WritableDataProvider };
