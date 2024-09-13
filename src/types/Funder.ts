import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ShortCode } from './ShortCode';

interface Funder {
	readonly shortCode: ShortCode;
	name: string;
	readonly createdAt: string;
}

type WritableFunder = Writable<Funder>;

type InternallyWritableFunder = WritableFunder & Pick<Funder, 'shortCode'>;

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

export { Funder, InternallyWritableFunder, isWritableFunder, WritableFunder };
