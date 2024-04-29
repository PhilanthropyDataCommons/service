import { ajv } from '../ajv';
import type { JSONSchemaType } from 'ajv';
import type { Writable } from './Writable';

interface Opportunity {
	readonly id: number;
	title: string;
	readonly createdAt: string;
}

type WritableOpportunity = Writable<Opportunity>;

const writableOpportunitySchema: JSONSchemaType<WritableOpportunity> = {
	type: 'object',
	properties: {
		title: {
			type: 'string',
		},
	},
	required: ['title'],
};
const isWritableOpportunity = ajv.compile(writableOpportunitySchema);

export {
	Opportunity,
	WritableOpportunity,
	writableOpportunitySchema,
	isWritableOpportunity,
};
