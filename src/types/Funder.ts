import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface Funder {
	readonly id: number;
	name: string;
	readonly createdAt: string;
}

type WritableFunder = Writable<Funder>;

const writableFunderSchema: JSONSchemaType<WritableFunder> = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
	},
	required: ['name'],
};

const isWritableFunder = ajv.compile(writableFunderSchema);

export { Funder, isWritableFunder, WritableFunder };
