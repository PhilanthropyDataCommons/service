import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';
import type { ProposalFieldValue } from './ProposalFieldValue';

interface Changemaker {
	readonly id: number;
	taxId: string;
	name: string;
	readonly fields: ProposalFieldValue[];
	readonly createdAt: string;
}

type WritableChangemaker = Writable<Changemaker>;

const writableChangemakerSchema: JSONSchemaType<WritableChangemaker> = {
	type: 'object',
	properties: {
		taxId: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
	},
	required: ['taxId', 'name'],
};

const isWritableChangemaker = ajv.compile(writableChangemakerSchema);

export {
	isWritableChangemaker,
	Changemaker,
	WritableChangemaker,
	writableChangemakerSchema,
};
